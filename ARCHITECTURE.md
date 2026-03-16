# 🏛️ System Architecture Details

This document provides an in-depth view of the architectural decisions, system layers, and data relationships of the BeTalent Payment API.

---

## 1. Domain Model (Entity Relationship Diagram)

This diagram illustrates how the database tables interact. It highlights the one-to-many relationship between Transactions and Products, handled by the pivot table `transaction_products`.

```mermaid
erDiagram
    USER ||--o{ TRANSACTION : creates
    USER {
        int id PK
        string name
        string email
        string role "ADMIN, MANAGER, FINANCE, USER"
    }
    
    TRANSACTION ||--|{ TRANSACTION_PRODUCT : contains
    TRANSACTION {
        string id PK
        int user_id FK
        float total_amount
        string status "pending, approved, failed, refunded"
        string idempotency_key
    }
    
    PRODUCT ||--o{ TRANSACTION_PRODUCT : included_in
    PRODUCT {
        int id PK
        string name
        float price
    }
    
    TRANSACTION_PRODUCT {
        int id PK
        string transaction_id FK
        int product_id FK
        int quantity
        float unit_price
    }
```

---

## 2. Layered Architecture Mapping

The API uses a strict separation of concerns. HTTP transport logic never mixes with business rules or database queries.

```mermaid
flowchart LR
    A[Client Request] --> B[Controller Layer]
    B --> C[Service Layer]
    C --> D[Gateway Integrations]
    C --> E[Persistence Layer]
    E --> F[(MySQL Database)]
```

| Architectural Layer | File / Component | Responsibility |
|---------------------|------------------|----------------|
| **Controller Layer** | `TransactionsController.ts` | Handles HTTP, extracts payload, returns JSON. |
| **Service Layer** | `PaymentService.ts` | Orchestrates payment logic and gateway failover. |
| **Gateway Layer** | External Mock APIs | Simulates credit card processing. |
| **Persistence Layer** | `Transaction.ts`, `Product.ts` | AdonisJS Lucid ORM Models. |
| **Security Layer** | `auth_middleware`, `role_middleware` | Validates JWT tokens and user permissions. |

---

## 3. Complete Payment Sequence

This diagram maps the exact execution order of the system when a user attempts to make a payment.

```mermaid
sequenceDiagram
    participant Client
    participant Router
    participant Security (Auth/Role)
    participant Controller
    participant Database
    participant PaymentService
    participant Gateways

    Client->>Router: POST /transactions
    Router->>Security (Auth/Role): Verify JWT & Role
    Security (Auth/Role)->>Controller: Request Authorized

    Controller->>Controller: Verify Idempotency-Key
    
    alt Idempotency-Key already exists
        Controller-->>Client: Return previous transaction (200 OK)
    else New Request
        Controller->>Database: Fetch requested Products
        Database-->>Controller: Return Prices
        Controller->>Controller: Calculate Total Amount
        
        Controller->>PaymentService: Process Payment
        PaymentService->>Gateways: Attempt Gateway 1
        
        alt Gateway 1 Fails
            PaymentService->>Gateways: Automatic Retry Gateway 2
        end
        
        Gateways-->>PaymentService: Payment Approved
        PaymentService-->>Controller: Result Data
        
        Controller->>Database: BEGIN TRANSACTION (MySQL)
        Controller->>Database: Insert Transaction & Pivot Records
        Controller->>Database: COMMIT
        
        Controller-->>Client: Payment Success (201 Created)
    end
```