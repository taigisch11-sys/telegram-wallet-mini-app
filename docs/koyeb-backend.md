# Backend deploy on Koyeb Free

Use this guide to deploy the Express API and Telegram bot runtime to Koyeb while keeping the database in Neon.

## Source

- Repository: `https://github.com/taigisch11-sys/telegram-wallet-mini-app`
- Branch: `master`
- Builder: Dockerfile
- Dockerfile path: `Dockerfile`
- Exposed port: `4000`
- Health check path: `/health`

## Environment variables

Required:

```dotenv
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...
JWT_SECRET=generate-a-long-random-secret
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBAPP_URL=https://taigisch11-sys.github.io/telegram-wallet-mini-app/
FRONTEND_ORIGIN=https://taigisch11-sys.github.io
DEV_AUTH_BYPASS=false
BOT_MODE=polling
```

For a free temporary deploy, `BOT_MODE=polling` is simpler because it does not require configuring a Telegram webhook URL before the backend URL is known.

After Koyeb gives the public backend URL, update GitHub repository variable `VITE_API_URL` to that URL and rerun the GitHub Pages workflow.

Example:

```dotenv
VITE_API_URL=https://your-koyeb-service.koyeb.app
```

Then set `BOT_MODE=webhook` only if you want production webhook mode:

```dotenv
BOT_MODE=webhook
TELEGRAM_WEBHOOK_URL=https://your-koyeb-service.koyeb.app/api/telegram/webhook
TELEGRAM_WEBHOOK_SECRET=generate-a-long-random-secret
```
