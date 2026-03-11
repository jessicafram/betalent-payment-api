import type { HttpContext } from '@adonisjs/core/http'
import Transaction from '#models/transaction'
import Product from '#models/product'
import TransactionProduct from '#models/transaction_product'
import PaymentService from '#services/payment_service'
import { TransactionStatus, GatewayNames } from '../enums/payment_enums.js'
export default class TransactionsController {
    /**
     * Processa uma nova compra (Checkout)
     */
    async store({ auth, request, response }: HttpContext) {
        const { products, card_info, client_id } = request.all()
        const user = auth.user!

        if (!products || !Array.isArray(products) || products.length === 0) {
            return response.badRequest({ message: 'O carrinho está vazio ou em formato inválido.' })
        }

        let totalAmount = 0
        const productsToSave = []

        // Validação e cálculo do total com base no banco de dados
        for (const item of products) {
            const productInDb = await Product.find(item.id)
            if (!productInDb) {
                return response.notFound({ message: `Produto ID ${item.id} não encontrado.` })
            }

            totalAmount += productInDb.price * item.quantity
            productsToSave.push({ productId: productInDb.id, quantity: item.quantity })
        }

        // Integração com o serviço de pagamentos (Gateways)
        const paymentResult = await PaymentService.processPayment(totalAmount, card_info || {}, user.email)
        if (!paymentResult.success) {
            return response.paymentRequired({
                message: 'Falha na comunicação com o Gateway ou pagamento recusado.',
                error: paymentResult.error,
            })
        }

        const cardLastNumbers = card_info?.cardNumber ? card_info.cardNumber.slice(-4) : null

        // Persistência da transação
        const transaction = await Transaction.create({
            userId: user.id,
            clientId: client_id,
            amount: totalAmount,
            gateway: paymentResult.gateway,
            status: TransactionStatus.COMPLETED,
            cardLastNumbers: cardLastNumbers,
            externalId: paymentResult.externalId,
        })

        // Persistência dos itens na tabela pivot
        for (const item of productsToSave) {
            await TransactionProduct.create({
                transactionId: transaction.id,
                productId: item.productId,
                quantity: item.quantity,
            })
        }

        return response.created({
            message: 'Transação concluída com sucesso.',
            transaction: {
                id: transaction.id,
                totalAmount: totalAmount,

                gateway: GatewayNames[paymentResult.gateway as keyof typeof GatewayNames],
                externalId: paymentResult.externalId,
                cardLastNumbers: cardLastNumbers
            }
        })
    }

    /**
     * Lista todas as transações cadastradas
     */
    async index({ response }: HttpContext) {
        const transactions = await Transaction.all()
        return response.ok(transactions)
    }

    /**
     * Retorna os detalhes de uma transação específica
     */
    async show({ params, response }: HttpContext) {
        try {
            const transaction = await Transaction.query()
                .where('id', params.id)
                .preload('user')
                .preload('client')
                .firstOrFail()

            return response.ok(transaction)
        } catch (error) {
            return response.notFound({ message: 'Transação não encontrada.' })
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