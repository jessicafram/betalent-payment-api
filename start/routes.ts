import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Importações dos Controllers
const AuthController = () => import('#controllers/auth_controller')
const ProductsController = () => import('#controllers/products_controller')
const TransactionsController = () => import('#controllers/transactions_controller')

router.get('/', async () => {
  return { status: 'BeTalent API is running' }
})

// Rota de Login (Pública)
router.post('/login', [AuthController, 'login'])

// Grupo de rotas protegidas (Exigem Token)
router.group(() => {

  // Rotas de Produtos
  router.get('/products', [ProductsController, 'index'])
  router.post('/products', [ProductsController, 'store']).use(
    middleware.role(['ADMIN'])
  )

  // Rota de Venda (Checkout)
  router.post('/checkout', [TransactionsController, 'store'])

}).use(middleware.auth())