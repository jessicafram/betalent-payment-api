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
  transactions: {
    store: typeof routes['transactions.store']
  }
}
