import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router.post('/payments', '#controllers/payments_controller.handle')
  .use(middleware.predictiveResilience())

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

// --- Rotas Privadas (Exigem Autenticação) ---
router.group(() => {

  // Produtos
  router.get('/products', '#controllers/products_controller.index')
  router.post('/products', '#controllers/products_controller.store')
    .use(middleware.role(['ADMIN', 'MANAGER', 'FINANCE']))

  // Clientes
  router.get('/clients', '#controllers/clients_controller.index')
  router.post('/clients', '#controllers/clients_controller.store')
  router.get('/clients/:id', '#controllers/clients_controller.show')

  // Transações e Checkout
  router.post('/checkout', '#controllers/transactions_controller.store')
    .use(middleware.predictiveResilience()) // Nossa IA aqui!

  router.get('/transactions', '#controllers/transactions_controller.index')
  router.get('/transactions/:id', '#controllers/transactions_controller.show')

  // Estorno / Chargeback
  router.post('/transactions/:id/chargeback', '#controllers/transactions_controller.chargeback')
    .use(middleware.role(['ADMIN', 'MANAGER', 'FINANCE']))

}).use(middleware.auth())