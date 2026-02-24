import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { bot } from "./bot.js";

const app = new Hono();

app.post("/webhooks/slack", async (c) => {
  try {
    const response = await bot.webhooks.slack(c.req.raw);
    console.log("Webhook response:", response.status, await response.clone().text());
    return response;
  } catch (err) {
    console.error("Webhook error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

const port = Number(process.env.PORT) || 3000;

serve({ fetch: app.fetch, port }, () => {
  console.log(`Bot listening on port ${port}`);
});
