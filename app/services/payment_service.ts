import axios from 'axios'

export default class PaymentService {
    // Configurações vindas do enunciado da BeTalent
    private static g1Url = 'http://localhost:3001'

    public static async processWithGateway1(totalAmount: number, cardData: any) {
        try {
            // 1. Login no Gateway 1 para obter o token
            const login = await axios.post(`${this.g1Url}/login`, {
                email: "dev@betalent.tech",
                token: "FEC9BB078BF338F464F96B48089EB498"
            })

            const token = login.data.token

            // 2. Envio da transação (valor convertido para centavos)
            const response = await axios.post(
                `${this.g1Url}/transactions`,
                {
                    amount: Math.round(totalAmount * 100),
                    name: cardData.name || "Cliente Teste",
                    email: cardData.email || "teste@email.com",
                    cardNumber: cardData.cardNumber || "5569000000006063",
                    cvv: cardData.cvv || "010"
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            )

            return { success: true, gateway: 'BeTalent Gateway 1', externalId: response.data.id }
        } catch (error) {
            // Se o Docker estiver desligado ou der erro, ele cai aqui
            console.error('Erro na chamada do Gateway 1:', error.message)
            return { success: false, error: 'Gateway 1 Indisponível' }
        }
    }
}