import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Gateway extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare name: string

    @column()
    declare priority: number

    // Dica de Especialista: No Adonis, escrevemos em camelCase no Model (isActive) 
    // e ele converte automaticamente para snake_case (is_active) no Banco de Dados!
    @column()
    declare isActive: boolean

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}