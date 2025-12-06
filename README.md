# Node.js Order Management API

A small but production-style Node.js API for managing **users, products, orders, and payments**, built as a take-home assignment.

* Runtime: **Node.js + Express (ES modules)**
* Auth: **JWT** with role-based access (`admin`, `customer`, `seller`)
* Data: **in-memory repositories** (no external DB, but schema defined for easy migration)
* Validation: **express-validator**
* Middleware: auth, roles, validation, rate-limiting, logging, centralized error handling

---

## 1. Setup Instructions

### 1.1 Prerequisites

* Node.js **v18+** (recommended v20)
* npm

### 1.2 Install dependencies

```bash
npm install
```

### 1.3 Environment variables

Create `.env` in the project root:

* `PORT` – API port (default: `3000`)
* `JWT_SECRET` – secret key for signing JWT tokens
* `NODE_ENV` – `development` or `production` (some dev helpers disabled in prod)

#### Sample `.env`

```env
PORT=3000
JWT_SECRET=super-secret-key
NODE_ENV=development
```

### 1.4 Run the API

#### Development (with nodemon)

```bash
npm run dev
```

#### Production

```bash
npm start
```

### 1.5 Health check

```http
GET /health
→ { "status": "ok" }
```

---

## 2. Project Structure

```txt
src/
  app.js               # Express app
  server.js            # Server startup

  config/
    env.js             # Env configuration

  routes/
    auth.routes.js
    product.routes.js
    order.routes.js
    payment.routes.js
    user.routes.js     # admin: /api/users/:userId/orders

  controllers/
    auth.controller.js
    product.controller.js
    order.controller.js
    payment.controller.js
    user.controller.js

  services/
    auth.service.js
    product.service.js
    order.service.js
    payment.service.js

  repositories/
    user.repository.js
    product.repository.js
    order.repository.js
    payment.repository.js

  models/
    user.model.js
    product.model.js
    order.model.js
    payment.model.js

  middleware/
    auth.middleware.js         # JWT + roles
    validation.middleware.js   # express-validator integration
    rateLimit.middleware.js
    error.middleware.js        # 404 + error handler

  validations/
    auth.validation.js
    product.validation.js
    order.validation.js
    payment.validation.js

  utils/
    ApiError.js
    response.js
    constants.js               # roles, statuses, error codes
    pagination.js
```

---

## 3. API Documentation

### 3.1 Auth & Users

#### Roles

* `admin`
* `customer`
* `seller`

#### 3.1.1 Seed admin (dev helper)

```http
POST /api/auth/seed-admin
```

* Dev-only helper (disabled if `NODE_ENV=production`)
* Creates admin:

  * `email`: `admin@example.com`
  * `password`: `Admin@123`

#### 3.1.2 Register (customer)

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "password123"
}
```

* Creates a **customer** user.
* Returns `{ user, token }`.

#### 3.1.3 Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "password123"
}
```

* Returns JWT token and safe user details:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "…",
      "name": "Alice",
      "email": "alice@example.com",
      "role": "customer",
      "createdAt": "…"
    },
    "token": "jwt-token-here"
  }
}
```

#### 3.1.4 Get profile

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

* Returns current logged-in user.

#### 3.1.5 Admin: get specific user’s orders

```http
GET /api/users/:userId/orders
Authorization: Bearer <admin-token>
```

Query params (all optional):

* `status` – `pending|confirmed|processing|shipped|delivered|cancelled`
* `dateFrom` / `dateTo` – ISO dates
* `minTotal` / `maxTotal` – numeric
* `search` – order ID or customer name/email
* `sortBy` – `createdAt` or `grandTotal`/`total`
* `order` – `asc` or `desc` (default `desc`)
* `page`, `limit` – pagination

Response shape:

```json
{
  "success": true,
  "data": [ /* orders */ ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

---

### 3.2 Products

Public read; admin/seller write.

#### 3.2.1 Create product

```http
POST /api/products
Authorization: Bearer <admin-or-seller-token>
Content-Type: application/json

{
  "name": "Laptop",
  "description": "15-inch, 16GB RAM",
  "price": 50000,
  "stock": 10
}
```

#### 3.2.2 List products (with filters & pagination)

```http
GET /api/products?page=1&limit=10&search=laptop&minPrice=10000&maxPrice=80000
```

Response:

```json
{
  "success": true,
  "data": [ /* products */ ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

* `search` – matches name or description
* `minPrice`, `maxPrice` – filter price range
* Only `isActive=true` products returned

#### 3.2.3 Get single product

```http
GET /api/products/:id
```

#### 3.2.4 Update product

To align with the spec, both PUT and PATCH are supported and map to the same controller:

```http
PUT /api/products/:id
PATCH /api/products/:id
Authorization: Bearer <admin-or-seller-token>
Content-Type: application/json

{
  "price": 52000,
  "stock": 8
}
```

#### 3.2.5 Delete product

```http
DELETE /api/products/:id
Authorization: Bearer <admin-or-seller-token>
```

* Soft delete: sets `isActive=false`.

#### 3.2.6 Update stock

```http
PATCH /api/products/:id/stock
Authorization: Bearer <admin-or-seller-token>
Content-Type: application/json

{
  "stock": 20
}
```

---

### 3.3 Orders

Order lifecycle:

```txt
pending → confirmed → processing → shipped → delivered
         ↓
      cancelled   (only from pending/confirmed)
```

#### 3.3.1 Create order

```http
POST /api/orders
Authorization: Bearer <customer-token>
Content-Type: application/json

{
  "items": [
    { "productId": "<product-id>", "quantity": 2 }
  ],
  "shippingAddress": {
    "line1": "123 Street",
    "city": "Mumbai",
    "state": "MH",
    "postalCode": "400001",
    "country": "IN"
  },
  "paymentMethod": "card"
}
```

Business rules:

* Validates each `productId` and `quantity`.
* Ensures sufficient stock; if not → `INSUFFICIENT_STOCK`.
* Calculates `totals`:

  * `subTotal` = sum of `priceAtPurchase * quantity`
  * `tax` (demo: 18% of subtotal)
  * `discount` (0 in this implementation)
  * `grandTotal` = `subTotal + tax - discount`
* Deducts product stock.
* Status starts as **`pending`**.

#### 3.3.2 List orders (current user or all for admin/seller)

```http
GET /api/orders?status=pending&sortBy=createdAt&order=desc&page=1&limit=10&search=ORD-123
Authorization: Bearer <token>
```

* If `role=customer` → only own orders.
* If `role=admin|seller` → all orders.

Filters:

* `status`, `dateFrom`, `dateTo`
* `minTotal`, `maxTotal`
* `search`:

  * customer: search by **order id**
  * admin/seller: order id **or** customer name/email
* Sorting:

  * `sortBy=createdAt` or `sortBy=total|grandTotal`
  * `order=asc|desc` (default `desc`)
* Pagination: `page`, `limit`

#### 3.3.3 Get single order

```http
GET /api/orders/:id
Authorization: Bearer <token>
```

* Customer can only see their own orders.
* Admin/seller can see any order.

#### 3.3.4 Get order invoice

```http
GET /api/orders/:id/invoice
Authorization: Bearer <token>
```

Returns an invoice view:

```json
{
  "success": true,
  "data": {
    "invoiceId": "INV-ORD-...",
    "orderId": "ORD-...",
    "status": "pending",
    "createdAt": "…",
    "customer": {
      "id": "…",
      "name": "Alice",
      "email": "alice@example.com"
    },
    "items": [
      { "productId": "…", "quantity": 2, "priceAtPurchase": 50000 }
    ],
    "totals": {
      "subTotal": 100000,
      "tax": 18000,
      "discount": 0,
      "grandTotal": 118000
    },
    "shippingAddress": { "line1": "…", "city": "…", "postalCode": "…", "country": "…" }
  }
}
```

#### 3.3.5 Update order status (admin/seller)

```http
PATCH /api/orders/:id/status
Authorization: Bearer <admin-or-seller-token>
Content-Type: application/json

{
  "status": "confirmed"
}
```

* Enforces valid transitions only:

  * `pending → confirmed|cancelled`
  * `confirmed → processing|cancelled`
  * `processing → shipped`
  * `shipped → delivered`

#### 3.3.6 Cancel order

```http
POST /api/orders/:id/cancel
Authorization: Bearer <customer-or-admin-token>
```

Rules:

* Customer can cancel **only their own** orders.
* Cancellation allowed **only** from `pending` or `confirmed`.
* On cancel:

  * Product stock is restored.
  * If payment was successful, payment status is set to `refunded`.
  * Order status becomes `cancelled`.

#### 3.3.7 Bulk order creation (admin/seller)

```http
POST /api/orders/bulk
Authorization: Bearer <admin-or-seller-token>
Content-Type: application/json

{
  "orders": [
    {
      "items": [
        { "productId": "<product-id-1>", "quantity": 1 }
      ],
      "shippingAddress": { "line1": "…", "city": "…", "postalCode": "…", "country": "…" },
      "paymentMethod": "card"
    },
    {
      "items": [
        { "productId": "<product-id-2>", "quantity": 3 }
      ],
      "shippingAddress": { "line1": "…", "city": "…", "postalCode": "…", "country": "…" },
      "paymentMethod": "upi"
    }
  ]
}
```

Each order runs through the same validation & stock logic as single order creation.

#### 3.3.8 Order statistics (admin)

```http
GET /api/orders/stats/summary
Authorization: Bearer <admin-token>
```

Returns:

```json
{
  "success": true,
  "data": {
    "totalOrders": 10,
    "totalRevenue": 123000,
    "byStatus": {
      "pending": 2,
      "confirmed": 3,
      "processing": 1,
      "shipped": 1,
      "delivered": 2,
      "cancelled": 1
    }
  }
}
```

---

### 3.4 Payments

#### 3.4.1 Process payment

```http
POST /api/payments/:orderId/process
Authorization: Bearer <customer-or-admin-token>
Content-Type: application/json

{
  "method": "card"
}
```

Behavior (simplified for assignment):

* Validates order ownership (customer) or admin/seller.
* Creates/updates a **payment** with:

  * `amount = order.totals.grandTotal`
  * `status = "success"`
  * `transactionRef = "TXN-..."`.
* If order status is `pending`, it is moved to `confirmed`.
* Links `paymentId` to the order.

#### 3.4.2 Get payment status

```http
GET /api/payments/:orderId/status
Authorization: Bearer <token>
```

* Customer: own order only.
* Admin/seller: any order.

#### 3.4.3 Refund payment (admin)

```http
POST /api/payments/:orderId/refund
Authorization: Bearer <admin-token>
```

Rules:

* Only **successful** payments can be refunded.
* Sets `payment.status = "refunded"`.
* Note: cancelling an order from `pending/confirmed` also auto-marks a successful payment as `refunded`.

---

## 4. Database Schema (Conceptual)

The implementation uses **in-memory arrays** as data stores, but models are defined to match what would be persisted in a real DB (SQL or NoSQL).

### 4.1 Users

**Collection/Table**: `users`

| Field          | Type   | Description                     |
| -------------- | ------ | ------------------------------- |
| `id`           | string | Unique user ID (UUID)           |
| `name`         | string | User name                       |
| `email`        | string | Unique email                    |
| `passwordHash` | string | Bcrypt hash of password         |
| `role`         | enum   | `admin` | `customer` | `seller` |
| `createdAt`    | Date   | Creation timestamp              |

### 4.2 Products

**Collection/Table**: `products`

| Field         | Type    | Description              |
| ------------- | ------- | ------------------------ |
| `id`          | string  | Unique product ID (UUID) |
| `name`        | string  | Product name             |
| `description` | string  | Optional description     |
| `price`       | number  | Price at current time    |
| `stock`       | number  | Available quantity       |
| `isActive`    | boolean | Soft-delete flag         |
| `createdAt`   | Date    | Creation timestamp       |
| `updatedAt`   | Date    | Last update timestamp    |

### 4.3 Orders

**Collection/Table**: `orders`

| Field             | Type   | Description                                                                    |                   |
| ----------------- | ------ | ------------------------------------------------------------------------------ | ----------------- |
| `id`              | string | Order ID (`ORD-<timestamp>-<rand>`)                                            |                   |
| `userId`          | string | ID of the customer placing the order                                           |                   |
| `items`           | array  | Line items (see below)                                                         |                   |
| `status`          | enum   | `pending` | `confirmed` | `processing` | `shipped` | `delivered` | `cancelled` |                   |
| `totals`          | object | `{ subTotal, tax, discount, grandTotal }`                                      |                   |
| `shippingAddress` | object | `{ line1, city, state, postalCode, country }`                                  |                   |
| `paymentId`       | string | null                                                                           | Linked payment ID |
| `createdAt`       | Date   | Creation timestamp                                                             |                   |
| `updatedAt`       | Date   | Last update timestamp                                                          |                   |

**Order items** (embedded in `items`):

| Field             | Type   | Description                 |
| ----------------- | ------ | --------------------------- |
| `productId`       | string | ID of product               |
| `quantity`        | number | Number of units             |
| `priceAtPurchase` | number | Product price at order time |

### 4.4 Payments

**Collection/Table**: `payments`

| Field            | Type   | Description                                   |                                               |
| ---------------- | ------ | --------------------------------------------- | --------------------------------------------- |
| `id`             | string | Payment ID (UUID)                             |                                               |
| `orderId`        | string | Associated order ID                           |                                               |
| `method`         | string | e.g. `card`, `upi`, `cod`                     |                                               |
| `amount`         | number | Payment amount (typically order grandTotal)   |                                               |
| `status`         | enum   | `pending` | `success` | `failed` | `refunded` |                                               |
| `transactionRef` | string | null                                          | External reference / simulated transaction ID |
| `createdAt`      | Date   | Creation timestamp                            |                                               |
| `updatedAt`      | Date   | Last update timestamp                         |                                               |

---

## 5. Postman Collection / Swagger

* A **Postman collection** can be exported and added under:

```txt
docs/postman_collection.json
```

Typical flow to test:

1. `POST /api/auth/seed-admin`
2. `POST /api/auth/login` (admin) → create products.
3. `POST /api/auth/register` → `POST /api/auth/login` (customer).
4. `POST /api/orders` (customer) → create order.
5. `POST /api/payments/:orderId/process` → pay for order.
6. `GET /api/orders/:id/invoice`
7. `GET /api/orders/stats/summary` (admin).

---

## 6. Error Handling & Conventions

All errors return a standardized JSON shape:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is already registered",
    "statusCode": 400
  }
}
```

Common error codes:

* `VALIDATION_ERROR`
* `UNAUTHORIZED`
* `FORBIDDEN`
* `NOT_FOUND`
* `INSUFFICIENT_STOCK`
* `INTERNAL_ERROR`

---

## 7. Notes & Assumptions

* Data is **not persisted** (in-memory arrays). Restarting the server resets all data.
* Payment is **simulated** and always succeeds for this assignment.
* Transaction handling, true DB connections, caching, and tests are intentionally omitted to keep the implementation focused on:

  * routing,
  * middleware chain design,
  * business logic,
  * and overall project structure.
