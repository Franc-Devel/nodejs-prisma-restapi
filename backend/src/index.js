import express from "express";
import productRoutes from "./routes/products.routes.js";
import categoryRoutes from "./routes/categories.routes.js";
import movieRoutes from "./routes/movies.routes.js";
import genreRoutes from "./routes/generes.routes.js";
import cors from "cors";
import { prisma } from "./db.js";

const app = express();
let server;

app.use(cors());
// Middleware para parsear JSON en el body de las solicitudes
app.use(express.json());

// --- RUTAS DE LA API ---
app.use("/api", productRoutes);
app.use("/api", categoryRoutes);
app.use("/api", movieRoutes);
app.use("/api", genreRoutes);

// --- MIDDLEWARE DE MANEJO DE ERRORES ---
app.use((err, req, res, next) => {
  // Loguear el error para debug en la terminal
  console.error(err);

  res.status(err.statusCode || 500).json({
    error: err.message || "Error Interno del Servidor",
  });
});

// --- LÓGICA DE APAGADO SEGURO (GRACEFUL SHUTDOWN) ---
async function shutdown(signal) {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await prisma.$disconnect();

  if (signal === "SIGUSR2") {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGUSR2", () => void shutdown("SIGUSR2"));

// --- INICIO DEL SERVIDOR ---
async function start() {
  await prisma.$connect();

  server = app.listen(3000, () => {
    console.log("Servidor escuchando en http://localhost:3000");
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
