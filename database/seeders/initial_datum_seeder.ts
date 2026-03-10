import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Gateway from '#models/gateway'

export default class extends BaseSeeder {
  async run() {
    await User.create({
      email: 'admin@betalent.com',
      password: 'password123',
      role: 'ADMIN'
    })

    await Gateway.createMany([
      { name: 'Gateway 1', priority: 1, isActive: true },
      { name: 'Gateway 2', priority: 2, isActive: true }
    ])
  }
}