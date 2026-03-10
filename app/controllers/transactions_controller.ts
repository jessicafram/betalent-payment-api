import type { HttpContext } from '@adonisjs/core/http'
import Gateway from '#models/gateway'
import Transaction from '#models/transaction'
import Product from '#models/product'
import TransactionProduct from '#models/transaction_product'
import PaymentService from '#services/payment_service'

export default class TransactionsController {
    async store({ auth, request, response }: HttpContext) {
        // Recebemos os produtos e as informações do cartão do Thunder Client
        const { products, card_info } = request.all()
        const user = auth.user!

        // 1. Validação básica
        if (!products || !Array.isArray(products) || products.length === 0) {
            return response.badRequest({ message: 'O carrinho está vazio.' })
        }

        // 2. Cálculo do total baseado no Banco de Dados (Requisito Nível 3)
        let totalCalculado = 0
        const listaParaSalvar = []

        for (const item of products) {
            const produtoNoBanco = await Product.find(item.id)

            if (!produtoNoBanco) {
                return response.notFound({ message: `Produto ID ${item.id} não encontrado.` })
            }

            totalCalculado += produtoNoBanco.price * item.quantity

            listaParaSalvar.push({
                productId: produtoNoBanco.id,
                quantity: item.quantity
            })
        }

        // 3. Integração Real com o Gateway (A mágica que você criou no Service)
        // O card_info vai levar nome, numero do cartão, cvv, etc.
        const paymentResult = await PaymentService.processWithGateway1(totalCalculado, card_info || {})

        // Se o gateway recusar ou estiver fora do ar, paramos por aqui
        if (!paymentResult.success) {
            return response.paymentRequired({
                message: 'Falha na comunicação com o Gateway ou pagamento recusado.',
                detalhe: paymentResult.error
            })
        }

        // 4. Se o pagamento deu certo, gravamos a transação principal no NOSSO MySQL
        const transaction = await Transaction.create({
            userId: user.id,
            amount: totalCalculado,
            gateway: paymentResult.gateway,
            status: 'completed'
        })

        // 5. Gravamos os itens na tabela de ligação (Nível 3)
        for (const item of listaParaSalvar) {
            await TransactionProduct.create({
                transactionId: transaction.id,
                productId: item.productId,
                quantity: item.quantity
            })
        }

        return response.ok({
            message: 'Venda Nível 3 concluída com sucesso e integrada!',
            total_pago: totalCalculado,
            transacao_id: transaction.id,
            gateway_id_externo: paymentResult.externalId
        })
    }
}