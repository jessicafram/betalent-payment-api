/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'auth.login': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.login']['types'],
  },
  'products.index': {
    methods: ["GET","HEAD"],
    pattern: '/products',
    tokens: [{"old":"/products","type":0,"val":"products","end":""}],
    types: placeholder as Registry['products.index']['types'],
  },
  'products.store': {
    methods: ["POST"],
    pattern: '/products',
    tokens: [{"old":"/products","type":0,"val":"products","end":""}],
    types: placeholder as Registry['products.store']['types'],
  },
  'clients.index': {
    methods: ["GET","HEAD"],
    pattern: '/clients',
    tokens: [{"old":"/clients","type":0,"val":"clients","end":""}],
    types: placeholder as Registry['clients.index']['types'],
  },
  'clients.store': {
    methods: ["POST"],
    pattern: '/clients',
    tokens: [{"old":"/clients","type":0,"val":"clients","end":""}],
    types: placeholder as Registry['clients.store']['types'],
  },
  'clients.show': {
    methods: ["GET","HEAD"],
    pattern: '/clients/:id',
    tokens: [{"old":"/clients/:id","type":0,"val":"clients","end":""},{"old":"/clients/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['clients.show']['types'],
  },
  'transactions.store': {
    methods: ["POST"],
    pattern: '/checkout',
    tokens: [{"old":"/checkout","type":0,"val":"checkout","end":""}],
    types: placeholder as Registry['transactions.store']['types'],
  },
  'transactions.index': {
    methods: ["GET","HEAD"],
    pattern: '/transactions',
    tokens: [{"old":"/transactions","type":0,"val":"transactions","end":""}],
    types: placeholder as Registry['transactions.index']['types'],
  },
  'transactions.show': {
    methods: ["GET","HEAD"],
    pattern: '/transactions/:id',
    tokens: [{"old":"/transactions/:id","type":0,"val":"transactions","end":""},{"old":"/transactions/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['transactions.show']['types'],
  },
  'transactions.chargeback': {
    methods: ["POST"],
    pattern: '/transactions/:id/chargeback',
    tokens: [{"old":"/transactions/:id/chargeback","type":0,"val":"transactions","end":""},{"old":"/transactions/:id/chargeback","type":1,"val":"id","end":""},{"old":"/transactions/:id/chargeback","type":0,"val":"chargeback","end":""}],
    types: placeholder as Registry['transactions.chargeback']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
