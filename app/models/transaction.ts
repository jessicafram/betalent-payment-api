import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Client from './client.ts'

export default class Transaction extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare userId: number

    @column()
    declare amount: number

    @column()
    declare gateway: string

    @column()
    declare status: string

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    @belongsTo(() => User)
    declare user: BelongsTo<typeof User>

    @column()
    declare clientId: number

    // E a relação com o cliente no final:
    @belongsTo(() => Client)
    declare client: BelongsTo<typeof Client>

    @column()
    declare cardLastNumbers: string

    @column()
    declare externalId: string | null
}