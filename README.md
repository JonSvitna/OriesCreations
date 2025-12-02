# 🏰 OriesCreations

Fantasy-themed artist website with e-commerce, user management, and membership system.

## ✨ Features

### Frontend (Static Site - FREE)
- 🎨 Fantasy-themed portfolio showcase
- 📱 Responsive design with Tailwind CSS
- 🖼️ Product gallery with categories
- 🌙 Accessibility-first design
- ⚡ Lightning-fast static hosting

### Backend (SQLite + Express)
- 🔐 JWT authentication & authorization
- 🛒 Shopping cart system
- 📦 Order management
- 💎 Membership tiers (basic, silver, gold, platinum)
- 💳 Stripe payment integration
- 🎭 Role-based access (admin, user, creator)
- 📊 Analytics tracking
- 🖌️ Fan art submission system

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JonSvitna/OriesCreations.git
   cd OriesCreations
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Initialize database with test data:**
   ```bash
   npm run seed
   ```

4. **Start the backend server:**
   ```bash
   npm start
   ```
   Server runs at `http://localhost:3000`

5. **Start the frontend dev server (separate terminal):**
   ```bash
   npm run dev:client
   ```
   Frontend runs at `http://localhost:5173`

6. **Test the API:**
   ```bash
   ./test-api.sh
   ```

## 🧪 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| 👑 Admin | admin@oriescreations.com | admin123 |
| 👤 User | demo@example.com | user1234 |
| 🎨 Creator | creator@oriescreations.com | creator123 |

## 📊 Database

**Current:** SQLite (file-based, perfect for development)
- Location: `./data/oriescreations.db`
- Size: ~88KB with seed data
- 8 tables with foreign key constraints
- Indexed for performance

**Production:** PostgreSQL (optional, for scaling)
- See [DEPLOYMENT.md](DEPLOYMENT.md) for migration guide

### Database Statistics
```
👥 Users: 4 (3 test accounts + 1 registered)
🛍️ Products: 12 (across 5 categories)
📦 Orders: Ready for transactions
⭐ Memberships: Tier system active
🛒 Cart: Session & user-based support
```

## 📚 Documentation

- **[BACKEND_README.md](BACKEND_README.md)** - Complete backend API documentation
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide for Render
- **[test-api.sh](test-api.sh)** - API testing script

## 🌐 Deployment on Render

### Current Setup: Static Site (FREE)

The `render.yaml` is configured for **free static site hosting** - perfect for portfolio showcase.

**Deploy Static Site:**
1. Fork this repository
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render automatically deploys from `render.yaml`

**Result:** Frontend-only site at `https://oriescreations.onrender.com`

**Note:** Backend features (auth, cart, payments) won't work on static hosting.

### Future: Add Backend Web Service

When ready for full functionality, manually create a Web Service on Render:
- **Cost:** ~$7-14/month
- **Features:** Full backend + database
- **Guide:** See [DEPLOYMENT.md](DEPLOYMENT.md)

## 🛠️ Tech Stack

### Frontend
- **Vite** - Build tool
- **Tailwind CSS** - Styling framework
- **Vanilla JS** - No framework overhead
- **Responsive** - Mobile-first design

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **SQLite** - Database (better-sqlite3)
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Stripe** - Payment processing

### DevOps
- **Render** - Hosting platform
- **Git** - Version control
- **npm** - Package management

## 🔒 Security Features

- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on all endpoints
- ✅ CORS protection
- ✅ SQL injection prevention (prepared statements)
- ✅ Role-based access control
- ✅ Secure Stripe webhook handling

## 📦 Project Structure

```
OriesCreations/
├── client/              # Frontend (Vite + Tailwind)
│   ├── src/
│   ├── public/
│   └── index.html
├── src/                 # Backend (Express + SQLite)
│   ├── config/         # Database configuration
│   ├── middleware/     # Auth & validation
│   ├── routes/         # API endpoints
│   └── utils/          # Helper functions
├── data/               # SQLite database
├── render.yaml         # Render deployment config
├── package.json        # Dependencies & scripts
└── README.md          # This file
```

## 🧑‍💻 Development Scripts

```bash
npm start              # Start backend server
npm run dev            # Start backend (alias)
npm run dev:client     # Start frontend dev server
npm run build:client   # Build frontend for production
npm run preview        # Preview production build
npm run seed           # Seed database with test data
./test-api.sh         # Test all API endpoints
```

## 🎯 Roadmap

- [x] SQLite database implementation
- [x] Authentication system
- [x] Shopping cart
- [x] Order management
- [x] Membership tiers
- [x] Stripe integration
- [x] Static site deployment
- [ ] PostgreSQL migration option
- [ ] Image upload system
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] SEO optimization

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**Made with ⚔️ for fantasy art lovers**
