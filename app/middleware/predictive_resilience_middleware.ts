import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'

// Memória da IA fora da classe para persistir entre as requisições
let latencyHistory: number[] = []

export default class PredictiveResilienceMiddleware {
    async handle(ctx: HttpContext, next: NextFn) {
        // 1. Definimos o Gateway Padrão
        ctx.request.updateBody({
            ...ctx.request.all(),
            targetGateway: 'https://gateway-principal.com'
        })

        // 2. Lógica da IA (Z-Score)
        if (latencyHistory.length > 10) {
            const mean = latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length
            const stdDev = Math.sqrt(
                latencyHistory.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / latencyHistory.length
            )

            const lastLatency = latencyHistory[latencyHistory.length - 1]
            const zScore = (lastLatency - mean) / stdDev

            // Se a anomalia for detectada (latência subiu demais)
            if (zScore > 2.5) {
                console.warn('⚠️ IA: Redirecionando para Gateway de Contingência')
                ctx.request.updateBody({
                    ...ctx.request.all(),
                    targetGateway: 'https://gateway-backup.com'
                })
            }
        }

        return next()
    }

    // Função estática para logar a latência no final do processo
    static logLatency(ms: number) {
        latencyHistory.push(ms)
        if (latencyHistory.length > 50) latencyHistory.shift()
    }
}