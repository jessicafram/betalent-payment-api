import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      // Chaves Estrangeiras (Relacionamentos)
      table.integer('client_id').unsigned().references('id').inTable('clients').notNullable()
      table.integer('gateway_id').unsigned().references('id').inTable('gateways').nullable()

      // Dados da Transação
      table.string('external_id').nullable() // ID gerado pelo Gateway (ex: "pay_123")
      table.enum('status', ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']).defaultTo('PENDING')
      table.integer('amount').notNullable() // Valor total da transação em centavos
      table.string('card_last_numbers', 4).notNullable() // Apenas os 4 últimos dígitos

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}