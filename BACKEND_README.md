# OriesCreations Backend - SQLite Implementation

## Overview
The backend is built with Node.js, Express, and SQLite for a lightweight, serverless database solution. Perfect for development and can scale to PostgreSQL in production.

## Database Schema

### Tables
- **users** - User accounts with authentication
- **products** - Product catalog with inventory
- **orders** - Customer orders
- **order_details** - Line items for orders
- **cart** - Shopping cart (session or user-based)
- **memberships** - User membership tiers
- **fan_art** - User-submitted fan art
- **analytics** - Event tracking

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
npm run seed
```

This creates the SQLite database at `./data/oriescreations.db` and seeds it with:
- 3 test user accounts
- 12 sample products
- 1 demo membership

### 3. Start the Server
```bash
npm start
```

Server runs on `http://localhost:3000`

### 4. Test the API
```bash
./test-api.sh
```

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@oriescreations.com | admin123 |
| User | demo@example.com | user1234 |
| Creator | creator@oriescreations.com | creator123 |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (authenticated)
- `PUT /api/auth/profile` - Update profile (authenticated)

### Products
- `GET /api/products` - Get all products (with filtering/pagination)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item quantity
- `DELETE /api/cart/items/:id` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Orders
- `GET /api/orders` - Get user orders (authenticated)
- `GET /api/orders/:id` - Get single order (authenticated)
- `POST /api/orders` - Create order from cart (authenticated)
- `PUT /api/orders/:id/status` - Update order status (admin only)

### Membership
- `GET /api/membership` - Get user membership (authenticated)
- `POST /api/membership/subscribe` - Subscribe to tier (authenticated)
- `DELETE /api/membership` - Cancel membership (authenticated)

### Payments (Stripe)
- `POST /api/payments/create-payment-intent` - Create payment intent
- `POST /api/payments/webhook` - Stripe webhook handler

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/analytics` - Get analytics data
- `PUT /api/admin/users/:id/role` - Update user role
- `DELETE /api/admin/users/:id` - Delete user

## Features

### Security
- ✅ JWT authentication
- ✅ Password hashing with bcryptjs
- ✅ Rate limiting on all endpoints
- ✅ CORS protection
- ✅ SQL injection prevention (prepared statements)
- ✅ Role-based access control (admin, user, creator)

### Database Features
- ✅ Foreign key constraints
- ✅ Indexes for performance
- ✅ Automatic timestamps
- ✅ Transaction support
- ✅ Data validation with CHECK constraints

### Shopping Features
- ✅ Product catalog with categories
- ✅ Shopping cart (session & user-based)
- ✅ Order management
- ✅ Inventory tracking
- ✅ Featured products
- ✅ Product search & filtering

### Membership System
- ✅ Multiple tiers (basic, silver, gold, platinum)
- ✅ Expiration tracking
- ✅ Tier benefits

## Database Location
- **Development:** `./data/oriescreations.db`
- **Test:** In-memory (`:memory:`)

## Migration to PostgreSQL

When ready for production, you can migrate from SQLite to PostgreSQL by:

1. Update `src/config/database.js` to use `pg` instead of `better-sqlite3`
2. Update SQL queries to use PostgreSQL syntax
3. Set `DATABASE_URL` environment variable
4. Run migration scripts

The schema is designed to be compatible with minimal changes needed.

## Development Workflow

```bash
# Install dependencies
npm install

# Seed database with test data
npm run seed

# Start backend server
npm start

# Start frontend dev server (separate terminal)
npm run dev:client

# Build frontend for production
npm run build:client
```

## File Structure
```
src/
├── config/
│   └── database.js          # SQLite configuration & schema
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── products.js          # Product routes
│   ├── cart.js              # Shopping cart routes
│   ├── orders.js            # Order routes
│   ├── membership.js        # Membership routes
│   ├── payments.js          # Stripe payment routes
│   └── admin.js             # Admin routes
├── utils/
│   └── seed.js              # Database seeding script
└── index.js                 # Express server entry point
```

## Performance Optimizations
- Indexed columns for fast queries
- Prepared statements for security & speed
- Rate limiting to prevent abuse
- Efficient pagination
- Static file caching

## Notes
- SQLite is single-file, portable, and perfect for development
- No separate database server needed
- Database file can be easily backed up
- Supports up to ~140TB of data
- Concurrent reads, sequential writes
- Perfect for small to medium deployments

---

**Ready to develop!** 🚀
