# BeTalent Payment API

API RESTful desenvolvida para o teste técnico da BeTalent. O sistema simula um processamento de pagamentos com roteamento inteligente entre dois gateways diferentes (Strategy Pattern) e sistema de Fallback.

## Tecnologias Utilizadas
* **Framework:** AdonisJS v6 (TypeScript)
* **Banco de Dados:** MySQL 8.0
* **Infraestrutura:** Docker & Docker Compose
* **Autenticação:** JWT (Lucid Auth)

---

## Como rodar o projeto localmente

### Pré-requisitos
* Node.js instalado
* Docker e Docker Desktop rodando

### Passo a Passo

1. **Instale as dependências:**
   ```bash
   npm install

   2. **Configure as Variáveis de Ambiente:**
   Copie o arquivo `.env.example` para `.env` e ajuste as credenciais do banco:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=root
   DB_DATABASE=betalent_payment