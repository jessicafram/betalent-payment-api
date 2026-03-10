import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, allowedRoles: string[]) {
    const user = ctx.auth.user

    // Se o usuário não estiver logado ou a role dele não estiver na lista permitida
    if (!user || !allowedRoles.includes(user.role)) {
      return ctx.response.forbidden({ message: 'Acesso negado: você não tem permissão para esta ação.' })
    }

    return next()
  }
}