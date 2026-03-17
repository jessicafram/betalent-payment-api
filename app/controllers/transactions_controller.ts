import type { HttpContext } from '@adonisjs/core/http'
import Transaction from '#models/transaction'
import Product from '#models/product'
import TransactionProduct from '#models/transaction_product'
import PaymentService from '#services/payment_service'
import { TransactionStatus, GatewayNames } from '../enums/payment_enums.js'
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'
import PredictiveResilienceMiddleware from '#middleware/predictive_resilience_middleware'

export default class TransactionsController {
    /**
     * Processa uma nova compra (Checkout)
     */
    async store({ auth, request, response }: HttpContext) {
        // 1. LIGA O RELÓGIO AQUI
        const startTime = Date.now()

        try {
            // 1. Recebe a Chave de Idempotência do Header
            const idempotencyKey = request.header('Idempotency-Key')

            if (idempotencyKey) {
                const existingTransaction = await Transaction.findBy('idempotencyKey', idempotencyKey)
                if (existingTransaction) {
                    logger.info('Requisição interceptada por Idempotência.', { idempotencyKey })
                    PredictiveResilienceMiddleware.logLatency(Date.now() - startTime)
                    return response.ok({ message: 'Transação já processada anteriormente.', transaction: existingTransaction })
                }
            }

            const { products, card_info, client_id } = request.all()
            const user = auth.user!

            if (!products || !Array.isArray(products) || products.length === 0) {
                PredictiveResilienceMiddleware.logLatency(Date.now() - startTime)
                return response.badRequest({ message: 'O carrinho está vazio.' })
            }

            let totalAmount = 0
            const productsToSave = []

            for (const item of products) {
                const productInDb = await Product.find(item.id)
                if (!productInDb) {
                    PredictiveResilienceMiddleware.logLatency(Date.now() - startTime)
                    return response.notFound({ message: `Produto ID ${item.id} não encontrado.` })
                }

                totalAmount += productInDb.price * item.quantity
                productsToSave.push({ productId: productInDb.id, quantity: item.quantity })
            }

            logger.info('Iniciando processamento de pagamento', { totalAmount, userId: user.id })

            const paymentResult = await PaymentService.processPayment(totalAmount, card_info || {}, user.email)

            if (!paymentResult.success) {
                logger.error('Falha no processamento do Gateway', { error: paymentResult.error })
                PredictiveResilienceMiddleware.logLatency(Date.now() - startTime)
                return response.paymentRequired({ message: 'Pagamento recusado.', error: paymentResult.error })
            }

            const cardLastNumbers = card_info?.cardNumber ? card_info.cardNumber.slice(-4) : null

            // 2. Transação de Banco (DB Transaction) Nível Sênior
            const trx = await db.transaction()

            try {
                const transaction = await Transaction.create({
                    userId: user.id,
                    clientId: client_id,
                    amount: totalAmount,
                    gateway: paymentResult.gateway,
                    status: TransactionStatus.COMPLETED,
                    cardLastNumbers: cardLastNumbers,
                    externalId: paymentResult.externalId,
                    idempotencyKey: idempotencyKey || null, // Salva a chave
                }, { client: trx })

                for (const item of productsToSave) {
                    await TransactionProduct.create({
                        transactionId: transaction.id,
                        productId: item.productId,
                        quantity: item.quantity,
                    }, { client: trx })
                }

                // Se tudo deu certo, COMITA (salva de verdade)
                await trx.commit()
                logger.info('Transação salva com sucesso no banco de dados', { transactionId: transaction.id })

                PredictiveResilienceMiddleware.logLatency(Date.now() - startTime)
                return response.created({
                    message: 'Transação concluída com sucesso.',
                    transaction: {
                        id: transaction.id,
                        totalAmount: totalAmount,
                        gateway: GatewayNames[paymentResult.gateway as keyof typeof GatewayNames],
                        externalId: paymentResult.externalId
                    }
                })

            } catch (error) {
                // Se algo falhou no meio (ex: erro no TransactionProduct), dá ROLLBACK (desfaz tudo)
                await trx.rollback()
                logger.error('Erro crítico ao salvar no banco. Rollback executado.', { error })
                PredictiveResilienceMiddleware.logLatency(Date.now() - startTime)
                return response.internalServerError({ message: 'Erro interno ao salvar a transação.' })
            }

        } catch (error) {
            const duration = Date.now() - startTime
            PredictiveResilienceMiddleware.logLatency(duration)
            return response.status(500).json({ error: 'Erro ao processar', details: error })
        }
    }

    /**
     * Processa o estorno (Chargeback) de uma transação
     */
    async chargeback({ params, response }: HttpContext) {
        const transaction = await Transaction.find(params.id)

        if (!transaction) {
            return response.notFound({ message: 'Transação não encontrada.' })
        }

        if (transaction.status === TransactionStatus.REFUNDED) {
            return response.badRequest({ message: 'Esta transação já foi estornada anteriormente.' })
        }

        const refundResult: any = await PaymentService.refundPayment(transaction)

        if (!refundResult.success) {
            return response.badRequest({
                message: 'Erro ao estornar o pagamento no Gateway.',
                error: refundResult.error
            })
        }

        transaction.status = TransactionStatus.REFUNDED
        await transaction.save()

        return response.ok({
            message: 'Estorno realizado com sucesso.',
            transactionId: transaction.id,
            status: transaction.status
        })
    }
}