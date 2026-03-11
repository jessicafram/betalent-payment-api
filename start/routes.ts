import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const ProductsController = () => import('#controllers/products_controller')
const TransactionsController = () => import('#controllers/transactions_controller')
const ClientsController = () => import('#controllers/clients_controller')

// Rota de Health Check (Verificar se a API está online)
router.get('/', async () => {
  return { status: 'BeTalent API is running' }
})

// Rotas Públicas
router.post('/login', [AuthController, 'login'])

// Rotas Privadas (Exigem Autenticação via Token)
router.group(() => {

  // --- Produtos ---
  router.get('/products', [ProductsController, 'index'])
  router.post('/products', [ProductsController, 'store']).use(
    middleware.role(['ADMIN', 'MANAGER', 'FINANCE'])
  )

  // --- Clientes ---
  router.get('/clients', [ClientsController, 'index'])
  router.post('/clients', [ClientsController, 'store'])
  router.get('/clients/:id', [ClientsController, 'show'])

  // --- Transações e Checkout ---
  router.post('/checkout', [TransactionsController, 'store'])
  router.get('/transactions', [TransactionsController, 'index'])
  router.get('/transactions/:id', [TransactionsController, 'show'])

  // Estorno / Chargeback (Acesso restrito a cargos de gestão e financeiro)
  router.post('/transactions/:id/chargeback', [TransactionsController, 'chargeback']).use(
    middleware.role(['ADMIN', 'MANAGER', 'FINANCE'])
  )

}).use(middleware.auth())