# OriesCreations

Artist website with user management/billing/marketing

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL (for production)

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/JonSvitna/OriesCreations.git
   cd OriesCreations
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies and start the server:
   ```bash
   npm install
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

## Deployment on Render

This project includes a `render.yaml` Blueprint Specification for easy deployment on [Render](https://render.com/).

### Deploy with Render Blueprint

1. Fork this repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect `render.yaml` and configure your services

### Services Created

- **Web Service**: Node.js application serving the website
- **PostgreSQL Database**: Database for user management and billing data

### Environment Variables

The following environment variables are configured automatically:

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set to `production` |
| `DATABASE_URL` | PostgreSQL connection string (auto-configured) |
| `SESSION_SECRET` | Randomly generated secret for sessions |

## License

MIT License - see [LICENSE](LICENSE) for details
