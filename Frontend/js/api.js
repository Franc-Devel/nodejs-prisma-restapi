// La ruta base de tu servidor Express
const API_URL = "http://localhost:3000/api";

// --- LLAMADAS DE STOCK ---
async function obtenerProductos() {
  try {
    const respuesta = await fetch(`${API_URL}/products`);
    return await respuesta.json();
  } catch (error) {
    console.error("Error al cargar productos:", error);
  }
}

// --- LLAMADAS DE CINE ---
async function obtenerGeneros() {
  try {
    const respuesta = await fetch(`${API_URL}/genres`);
    return await respuesta.json();
  } catch (error) {
    console.error("Error al cargar géneros:", error);
  }
}
