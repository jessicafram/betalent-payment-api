import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    // Atualiza ou cria os usuários sem tentar apagar os antigos!
    await User.updateOrCreateMany('email', [
      {
        email: 'admin@teste.com',
        password: '123',
        role: 'ADMIN',
      },
      {
        email: 'comum@teste.com',
        password: '123',
        role: 'USER',
      }
    ])
  }
}