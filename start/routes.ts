import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Importações dos Controllers
const AuthController = () => import('#controllers/auth_controller')
const ProductsController = () => import('#controllers/products_controller')
const TransactionsController = () => import('#controllers/transactions_controller')
const ClientsController = () => import('#controllers/clients_controller')

router.get('/', async () => {
  return { status: 'BeTalent API is running' }
})

// Rota de Login (Pública)
router.post('/login', [AuthController, 'login'])

// Grupo de rotas protegidas (Exigem Token)
router.group(() => {

  // --- Rotas de Produtos ---
  router.get('/products', [ProductsController, 'index'])

  // AQUI: Adicionamos o FINANCE na lista de quem pode criar produtos!
  router.post('/products', [ProductsController, 'store']).use(
    middleware.role(['ADMIN', 'MANAGER', 'FINANCE'])
  )

  // --- Rota de Venda (Checkout) ---
  router.post('/checkout', [TransactionsController, 'store'])

  // --- Rotas de Clientes ---
  router.get('/clients', [ClientsController, 'index'])
  router.post('/clients', [ClientsController, 'store'])
  router.get('/clients/:id', [ClientsController, 'show'])

  // --- Rotas de Transações/Compras ---
  router.get('/transactions', [TransactionsController, 'index'])
  router.get('/transactions/:id', [TransactionsController, 'show'])



  // AQUI: A nossa rota final! Só os "chefes" podem estornar dinheiro.
  router.post('/transactions/:id/chargeback', [TransactionsController, 'chargeback']).use(
    middleware.role(['ADMIN', 'MANAGER', 'FINANCE'])
  )

}).use(middleware.auth())