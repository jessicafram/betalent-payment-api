import type { HttpContext } from '@adonisjs/core/http'
import Transaction from '#models/transaction'
import Product from '#models/product'
import TransactionProduct from '#models/transaction_product'
import PaymentService from '#services/payment_service'

export default class TransactionsController {
    /**
     * Realizar uma compra (Checkout)
     */
    async store({ auth, request, response }: HttpContext) {
        const { products, card_info, client_id } = request.all()
        const user = auth.user!

        if (!products || !Array.isArray(products) || products.length === 0) {
            return response.badRequest({ message: 'O carrinho está vazio.' })
        }

        // Cálculo do total baseado no Banco de Dados
        let totalCalculado = 0
        const listaParaSalvar = []

        for (const item of products) {
            const produtoNoBanco = await Product.find(item.id)
            if (!produtoNoBanco) {
                return response.notFound({ message: `Produto ID ${item.id} não encontrado.` })
            }
            totalCalculado += produtoNoBanco.price * item.quantity
            listaParaSalvar.push({ productId: produtoNoBanco.id, quantity: item.quantity })
        }

        // Integração com o Gateway
        const paymentResult: any = await PaymentService.processPayment(totalCalculado, card_info || {})

        if (!paymentResult.success) {
            return response.paymentRequired({
                message: 'Falha na comunicação com o Gateway ou pagamento recusado.',
                detalhe: paymentResult.error,
            })
        }

        // Pegamos os 4 últimos dígitos do cartão (com uma checagem de segurança)
        const ultimosDigitos = card_info?.cardNumber ? card_info.cardNumber.slice(-4) : null

        // Gravação da transação no banco de dados
        const transaction = await Transaction.create({
            userId: user.id,
            clientId: client_id,
            amount: totalCalculado,
            gateway: paymentResult.gateway,
            status: 'completed',
            cardLastNumbers: ultimosDigitos, // Salvando os 4 últimos dígitos do cartão na transação
            externalId: paymentResult.externalId, // AQUI: A nossa "nota fiscal" do gateway!
        })
        // Gravação dos itens (Tabela Pivot)
        for (const item of listaParaSalvar) {
            await TransactionProduct.create({
                transactionId: transaction.id,
                productId: item.productId,
                quantity: item.quantity,
            })
        }

        return response.ok({
            message: 'Venda Nível 3 concluída com sucesso e ligada ao cliente!',
            total_pago: totalCalculado,
            gateway_id_externo: paymentResult.externalId,
            cartao_final: ultimosDigitos // Retornando para você ver no Thunder Client
        })
    }

    /**
     * Listar todas as compras (Exigido pelo Guia)
     */
    async index({ response }: HttpContext) {
        const transactions = await Transaction.all()
        return response.ok(transactions)
    }

    /**
       * Detalhes de uma compra específica (Exigido pelo Guia)
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
    } // <-- Fim da função show

    // 👇 COLAMOS A FUNÇÃO NOVA AQUI:

    // --- Função de Reembolso (Chargeback) ---
    public async chargeback({ params, response }: HttpContext) {
        // 1. Procuramos a transação no banco de dados
        const transaction = await Transaction.find(params.id)

        if (!transaction) {
            return response.notFound({ message: 'Transação não encontrada.' })
        }

        // 2. Verificamos se ela já foi cancelada antes
        if (transaction.status === 'refunded' || transaction.status === 'chargeback') {
            return response.badRequest({ message: 'Esta transação já foi estornada anteriormente.' })
        }

        // 3. Pedimos para a nossa "Mente Mestra" (PaymentService) ir cancelar no Gateway
        const refundResult: any = await PaymentService.refundPayment(transaction)

        if (!refundResult.success) {
            return response.badRequest({
                message: 'Erro ao estornar o pagamento no Gateway.',
                error: refundResult.error
            })
        }

        // 4. Se o Gateway devolveu o dinheiro, atualizamos nosso banco de dados
        transaction.status = 'refunded'
        await transaction.save()

        return response.ok({
            message: 'Estorno realizado com sucesso!',
            transaction_id: transaction.id,
            status: transaction.status
        })
    } 

}