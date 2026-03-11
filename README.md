# 💳 BeTalent Payment API

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![AdonisJS](https://img.shields.io/badge/adonisjs-220052?style=for-the-badge&logo=adonisjs&logoColor=white)
![MySQL](https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

**RESTful payment processing API with multi-gateway failover, role-based access control (RBAC), and full chargeback support.**

This system was developed as part of the BeTalent technical challenge and implements a full checkout, payment processing, and financial management workflow.

🎯 **Target Level: Level 3 (Advanced)**
All Level 3 requirements were successfully implemented, including backend price calculation from multiple products, strong typing, strict gateway authentication, role-based access control (ADMIN, MANAGER, FINANCE, USER), and complex chargeback integration.

---

## 🏗️ System Architecture & Design Patterns

The application follows a modular architecture focused on the separation of concerns, heavily utilizing the **Service Layer Pattern** and the **Strategy/Failover Pattern**.

### Architectural Layers
* **Controller Layer:** Handles HTTP requests, input validation, and payload responses.
* **Service Layer:** Contains the core business logic, gateway orchestration, and external integrations.
* **Model Layer:** Responsible for database persistence and relationships using the AdonisJS Lucid ORM.

### 1. High Availability Payment Processing (Failover Strategy)
The core processing logic is abstracted into the `PaymentService`. The system uses a *Gateway Redundancy* pattern to ensure high availability. If the original request fails due to network errors or provider refusal, the system performs an automatic and invisible retry (Failover) on the secondary approved gateway.

**Payment Flow Architecture Diagram:**
```text
Client Application
       │
       ▼
  AdonisJS API (TransactionsController)
       │
       ▼
 PaymentService (Failover Engine)
       │
       ├──► [Gateway 1] ── (Success) ──┐
       │                               │
   (Failure)                           ▼
       │                  Transaction Persistence (MySQL)
       └──► [Gateway 2] ───────────────┘