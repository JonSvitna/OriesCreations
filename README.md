# OriesCreations

Artist website with user management/billing/marketing

## Getting Started

### Prerequisites

- Node.js 18 or higher

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

### Free Static Site Deployment (Current Configuration)

The current `render.yaml` is configured for **free static site hosting**. This deploys only the frontend as static files.

**Note:** Static site deployment does not include backend functionality. Features like user authentication, cart, payments, and database operations will not work. This is ideal for:
- Portfolio/showcase websites
- Landing pages
- Static content display

#### Deploy as Static Site

1. Fork this repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect `render.yaml` and deploy a free static site

### Full-Stack Deployment (Paid)

If you need full backend functionality (authentication, payments, cart, etc.), you'll need to use Render's paid Web Service tier. Create a `render.yaml` with:

```yaml
services:
  - type: web
    name: oriescreations-web
    runtime: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: SESSION_SECRET
        generateValue: true
```

**Note:** Web Services on Render are paid services. See [Render Pricing](https://render.com/pricing) for details.

## License

MIT License - see [LICENSE](LICENSE) for details
