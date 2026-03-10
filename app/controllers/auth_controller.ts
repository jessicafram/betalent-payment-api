import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AuthController {
    async login({ request, response }: HttpContext) {
        const { email, password } = request.only(['email', 'password'])

        try {
            const user = await User.verifyCredentials(email, password)
            const token = await User.accessTokens.create(user)

            return response.ok({
                message: 'Login realizado com sucesso',
                token: token.value!.release(),
                user: { id: user.id, email: user.email, role: user.role }
            })
        } catch (error) {
            return response.unauthorized({ message: 'Credenciais inválidas' })
        }
    }
}