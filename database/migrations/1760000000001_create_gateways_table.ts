import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'gateways'

  async up() {
    this.schema.createTable(this.tableName, (table) => {

      table.increments('id').notNullable() // Apenas uma vez
      table.string('name').notNullable()
      table.boolean('is_active').defaultTo(true)
      table.integer('priority').notNullable() // 1 é prioridade máxima

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}