import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Client from '#models/client'
import { TransactionStatus, PaymentGateway } from '../enums/payment_enums.js'

export default class Transaction extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare userId: number

    @column()
    declare clientId: number

    @column()
    declare amount: number

    @column()
    declare gateway: PaymentGateway

    @column()
    declare status: TransactionStatus

    @column()
    declare cardLastNumbers: string | null

    @column()
    declare externalId: string | null

    @column()
    declare idempotencyKey: string | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    @belongsTo(() => User)
    declare user: BelongsTo<typeof User>

    @belongsTo(() => Client)
    declare client: BelongsTo<typeof Client>
}