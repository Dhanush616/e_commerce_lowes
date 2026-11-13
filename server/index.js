import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 4000;
const app = createApp();

const server = app.listen(port, () => {
  console.log("");
  console.log("  FashionStore API is running");
  console.log(`  → http://localhost:${port}`);
  console.log(`  → http://localhost:${port}/api/health`);
  console.log("");
  console.log("  Demo accounts");
  console.log("  → admin@fashionstore.test / Admin@123  (admin)");
  console.log("  → alex@example.com / User@123         (customer)");
  console.log("");
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Set PORT to another value.`);
    process.exit(1);
  }
  throw error;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    console.log("\nShutting down FashionStore API…");
    server.close(() => process.exit(0));
  });
}
