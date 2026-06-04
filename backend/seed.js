import { prisma } from "./src/db.js";

async function cargarDatos() {
  try {
    console.log("Iniciando carga de datos iniciales...");

    // 1. Cargar Categorías para el Stock
    await prisma.category.createMany({
      data: [
        { id: 1, name: "Memorias RAM y Componentes" },
        { id: 2, name: "Notebooks y Equipos" },
        { id: 3, name: "Periféricos" },
        { id: 4, name: "Almacenamiento (Discos/NAS)" },
        { id: 5, name: "Cables y Accesorios" },
      ],
      skipDuplicates: true, // Si ya existen, las saltea para no tirar error
    });
    console.log("📦 ¡Categorías de stock cargadas con éxito!");

    // 2. Mantener los Géneros del Cine
    await prisma.genre.createMany({
      data: [
        { id: 1, name: "Acción" },
        { id: 2, name: "Drama" },
        { id: 3, name: "Comedia" },
        { id: 4, name: "Terror" },
        { id: 5, name: "Ciencia Ficción" },
      ],
      skipDuplicates: true,
    });
    console.log("🎬 ¡Géneros de cine listos!");
  } catch (error) {
    console.error("❌ Error cargando la base de datos:", error);
  } finally {
    await prisma.$disconnect(); // Cierra la conexión de forma segura
  }
}

cargarDatos();
