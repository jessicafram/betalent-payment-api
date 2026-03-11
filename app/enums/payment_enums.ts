export enum TransactionStatus {
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED'
}

export enum PaymentGateway {
    GATEWAY_1 = 'GATEWAY_1',
    GATEWAY_2 = 'GATEWAY_2'
}

// Dicionário para quando precisarmos mostrar o nome bonito para o usuário
export const GatewayNames = {
    [PaymentGateway.GATEWAY_1]: 'BeTalent Gateway 1',
    [PaymentGateway.GATEWAY_2]: 'BeTalent Gateway 2'
}