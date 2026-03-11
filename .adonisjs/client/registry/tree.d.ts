/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    login: typeof routes['auth.login']
  }
  products: {
    index: typeof routes['products.index']
    store: typeof routes['products.store']
  }
  clients: {
    index: typeof routes['clients.index']
    store: typeof routes['clients.store']
    show: typeof routes['clients.show']
  }
  transactions: {
    store: typeof routes['transactions.store']
    index: typeof routes['transactions.index']
    show: typeof routes['transactions.show']
    chargeback: typeof routes['transactions.chargeback']
  }
}
