import axios from 'axios'
import { PaymentGateway } from '../enums/payment_enums.js'
import Transaction from '#models/transaction' // 👈 Importação do Model para tipagem forte!

export interface CardData {
    name?: string
    cardNumber: string
    cvv: string
}

export type PaymentResult =
    | { success: true; gateway: PaymentGateway; externalId: string }
    | { success: false; error: string; detalhes?: any }

export default class PaymentService {
    private static g1Url = process.env.G1_URL
    private static g1Email = process.env.G1_EMAIL
    private static g1Token = process.env.G1_TOKEN

    private static g2Url = process.env.G2_URL
    private static g2Token = process.env.G2_TOKEN
    private static g2Secret = process.env.G2_SECRET

    // 👇 Instância reutilizável do Axios (Melhor prática)
    private static httpClient = axios.create({
        timeout: 5000
    })

    public static async processPayment(totalAmount: number, cardData: CardData, customerEmail: string): Promise<PaymentResult> {
        const gateway1 = await this.processGateway1(totalAmount, cardData, customerEmail)
        if (gateway1.success) return gateway1

        const gateway2 = await this.processGateway2(totalAmount, cardData, customerEmail)
        if (gateway2.success) return gateway2

        return {
            success: false,
            error: 'Pagamento recusado em todos os gateways.',
            detalhes: { gateway1: gateway1.error, gateway2: gateway2.error }
        }
    }

    private static async authenticateGateway1(): Promise<string> {
        const response = await this.httpClient.post(`${this.g1Url}/login`, {
            email: this.g1Email,
            token: this.g1Token
        })
        return response.data.token
    }

    private static async processGateway1(totalAmount: number, cardData: CardData, customerEmail: string): Promise<PaymentResult> {
        try {
            const token = await this.authenticateGateway1()

            const response = await this.httpClient.post(
                `${this.g1Url}/transactions`,
                {
                    amount: Math.round(totalAmount * 100),
                    name: cardData.name || 'Cliente',
                    email: customerEmail,
                    cardNumber: cardData.cardNumber,
                    cvv: cardData.cvv
                },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            return { success: true, gateway: PaymentGateway.GATEWAY_1, externalId: response.data.id }
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || 'Gateway 1 Indisponível' }
        }
    }

    private static async processGateway2(totalAmount: number, cardData: CardData, customerEmail: string): Promise<PaymentResult> {
        try {
            const response = await this.httpClient.post(
                `${this.g2Url}/transacoes`,
                {
                    valor: Math.round(totalAmount * 100),
                    nome: cardData.name || 'Cliente',
                    email: customerEmail,
                    numeroCartao: cardData.cardNumber,
                    cvv: cardData.cvv
                },
                {
                    headers: {
                        'Gateway-Auth-Token': this.g2Token,
                        'Gateway-Auth-Secret': this.g2Secret
                    }
                }
            )

            return { success: true, gateway: PaymentGateway.GATEWAY_2, externalId: response.data.id }
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || 'Gateway 2 Indisponível' }
        }
    }

    // 👇 Tipagem forte aplicada ao parâmetro `transaction`
    public static async refundPayment(transaction: Transaction): Promise<{ success: boolean; error?: string }> {
        try {
            if (transaction.gateway === PaymentGateway.GATEWAY_1) {
                const token = await this.authenticateGateway1()
                await this.httpClient.post(
                    `${this.g1Url}/transactions/${transaction.externalId}/chargeback`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                return { success: true }
            }

            if (transaction.gateway === PaymentGateway.GATEWAY_2) {
                await this.httpClient.post(
                    `${this.g2Url}/transacoes/${transaction.externalId}/estorno`,
                    {},
                    { headers: { 'Gateway-Auth-Token': this.g2Token, 'Gateway-Auth-Secret': this.g2Secret } }
                )
                return { success: true }
            }

            return { success: false, error: 'Gateway desconhecido para estorno.' }
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || 'Erro na comunicação do estorno.' }
        }
    }
}