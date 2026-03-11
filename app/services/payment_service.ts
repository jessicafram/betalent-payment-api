import axios from 'axios'

export default class PaymentService {
    private static g1Url = 'http://localhost:3001'
    private static g2Url = 'http://localhost:3002'

    /**
     * A Mente Mestra: Tenta o Gateway 1. Se falhar, tenta o Gateway 2.
     */
    public static async processPayment(totalAmount: number, cardData: any) {
        console.log('Iniciando pagamento... Tentando Gateway 1');
        const resultG1 = await this.processWithGateway1(totalAmount, cardData);

        if (resultG1.success) {
            console.log('Pago com sucesso no Gateway 1');
            return resultG1;
        }

        console.log('Gateway 1 recusou. Tentando Gateway 2 (Fallback)...');
        const resultG2 = await this.processWithGateway2(totalAmount, cardData);

        if (resultG2.success) {
            console.log('Pago com sucesso no Gateway 2');
            return resultG2;
        }

        // Se os dois recusarem
        return {
            success: false,
            error: 'Pagamento recusado em todos os gateways.',
            detalhes: { gateway1: resultG1.error, gateway2: resultG2.error }
        };
    }

    /**
     * Integração com Gateway 1
     */
    public static async processWithGateway1(totalAmount: number, cardData: any) {
        try {
            const login = await axios.post(`${this.g1Url}/login`, {
                email: "dev@betalent.tech",
                token: "FEC9BB078BF338F464F96B48089EB498"
            });
            const token = login.data.token;

            const response = await axios.post(
                `${this.g1Url}/transactions`,
                {
                    amount: Math.round(totalAmount * 100),
                    name: cardData.name || "Cliente Teste",
                    email: "teste@email.com",
                    cardNumber: cardData.cardNumber,
                    cvv: cardData.cvv
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            return { success: true, gateway: 'BeTalent Gateway 1', externalId: response.data.id };
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || 'Gateway 1 Indisponível' };
        }
    }

    /**
     * Integração com Gateway 2
     */
    public static async processWithGateway2(totalAmount: number, cardData: any) {
        try {
            const response = await axios.post(
                `${this.g2Url}/transacoes`,
                {
                    valor: Math.round(totalAmount * 100),
                    nome: cardData.name || "Cliente Teste",
                    email: "teste@email.com",
                    numeroCartao: cardData.cardNumber,
                    cvv: cardData.cvv
                },
                {
                    headers: {
                        'Gateway-Auth-Token': 'tk_f2198cc671b5289fa856',
                        'Gateway-Auth-Secret': '3d15e8ed6131446ea7e3456728b1211f'
                    }
                }
            );

            return { success: true, gateway: 'BeTalent Gateway 2', externalId: response.data.id };
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || 'Gateway 2 Indisponível' };
        }
    }

    /**
     * Integração de Reembolso (Chargeback)
     */
    public static async refundPayment(transaction: any) {
        try {
            if (transaction.gateway === 'BeTalent Gateway 1') {
                // Estorno no Gateway 1
                const login = await axios.post(`${this.g1Url}/login`, {
                    email: "dev@betalent.tech",
                    token: "FEC9BB078BF338F464F96B48089EB498"
                });
                const token = login.data.token;

                await axios.post(
                    `${this.g1Url}/transactions/${transaction.externalId}/chargeback`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                return { success: true };

            } else if (transaction.gateway === 'BeTalent Gateway 2') {
                // Estorno no Gateway 2
                await axios.post(
                    `${this.g2Url}/transacoes/${transaction.externalId}/estorno`,
                    {},
                    {
                        headers: {
                            'Gateway-Auth-Token': 'tk_f2198cc671b5289fa856',
                            'Gateway-Auth-Secret': '3d15e8ed6131446ea7e3456728b1211f'
                        }
                    }
                );
                return { success: true };
            }

            return { success: false, error: 'Gateway desconhecido.' };

        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || 'Erro de comunicação com o Gateway.' };
        }
    }
}