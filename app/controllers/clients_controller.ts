import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client'

export default class ClientsController {
  public async index({ response }: HttpContext) {
    const clients = await Client.all()
    return response.ok(clients)
  }

  public async store({ request, response }: HttpContext) {
    const data = request.only(['name', 'email'])
    const existingClient = await Client.findBy('email', data.email)
    if (existingClient) {
      return response.badRequest({ message: 'Este e-mail de cliente já está cadastrado.' })
    }
    const client = await Client.create(data)
    return response.created({ message: 'Cliente cadastrado com sucesso!', client })
  }

  public async show({ params, response }: HttpContext) {
    try {
      const client = await Client.query()
        .where('id', params.id)
        .preload('transactions') // A linha vermelha aqui sumirá quando ajustarmos o Model abaixo
        .firstOrFail()
      return response.ok(client)
    } catch (error) {
      return response.notFound({ message: 'Cliente não encontrado.' })
    }
  }
}