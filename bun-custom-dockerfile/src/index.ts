const server = Bun.serve({
  port: Number(process.env.PORT) || 3000,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return Response.json({ status: "ok" });
    }

    return Response.json({
      message: "Hello from Bun!",
      runtime: `Bun ${Bun.version}`,
    });
  },
});

console.log(`Listening on port ${server.port}`);
