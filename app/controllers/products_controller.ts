import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'

export default class ProductsController {
    /**
     * Lista todos os produtos cadastrados
     */
    async index({ response }: HttpContext) {
        const products = await Product.all()
        return response.ok(products)
    }

    /**
     * Cria um novo produto
     */
    async store({ request, response }: HttpContext) {
        const data = request.only(['name', 'price', 'description'])

        // Cria o produto no banco de dados
        const product = await Product.create(data)

        return response.created({
            message: 'Produto cadastrado com sucesso',
            product
        })
    }
}