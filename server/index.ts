import app from "app";
import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT) || 3001;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 CreatorOS Backend running on http://0.0.0.0:${PORT}`);
});

const shutdown = () => {
  console.log("🛑 Shutting down server...");
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);