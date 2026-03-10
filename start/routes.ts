import router from '@adonisjs/core/services/router'

// Usando a importação direta para acalmar o TypeScript
const AuthController = () => import('../app/controllers/auth_controller.js')
router.get('/', async () => {
  return { status: 'BeTalent API is running' }
})

// Rota de Login
router.post('/login', [AuthController, 'login'])
const ProductsController = () => import('#controllers/products_controller')
import { middleware } from '#start/kernel'

// Grupo de rotas protegidas (exigem Token)
router.group(() => {
  router.get('/products', [ProductsController, 'index'])
  router.post('/products', [ProductsController, 'store'])
}).use(middleware.auth()) // Aqui é onde a mágica da segurança acontece!