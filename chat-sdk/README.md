# Slack Bot with Chat SDK + Specific

A Slack bot built with [Chat SDK](https://www.npmjs.com/package/chat) and deployed on [Specific](https://specific.dev).

## Stack

- **Chat SDK** (`chat` + `@chat-adapter/slack`) — unified chat bot framework
- **Hono** — lightweight HTTP server for webhook handling
- **Redis** — conversation state persistence
- **Specific** — infrastructure (service, Redis, secrets, public HTTPS endpoint)

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a Slack app with Event Subscriptions and Interactivity pointing at `<your-url>/webhooks/slack`. Required bot events: `app_mention`, `message.channels`, `message.im`.

3. Run locally (secrets are prompted on first run):
   ```
   specific dev
   ```

4. Deploy (secrets are prompted on first deploy):
   ```
   specific deploy
   ```
