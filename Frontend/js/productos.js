document.addEventListener("DOMContentLoaded", async () => {
  console.log("Módulo de Stock inicializado. 📦");

  await cargarCategorias();
  await cargarProductos();

  document
    .getElementById("product-form")
    .addEventListener("submit", guardarProducto);
});

// --- FUNCIONES DE LECTURA (GET) ---

async function cargarCategorias() {
  try {
    const respuesta = await fetch(`${API_URL}/categories`);
    const categorias = await respuesta.json();

    const select = document.getElementById("category");
    select.innerHTML =
      '<option value="" disabled selected>Seleccioná una categoría...</option>';

    categorias.forEach((cat) => {
      select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
  } catch (error) {
    console.error("Error al cargar categorías:", error);
  }
}

async function cargarProductos() {
  try {
    const respuesta = await fetch(`${API_URL}/products`);
    const productos = await respuesta.json();

    const contenedor = document.getElementById("products-container");
    contenedor.innerHTML = "";

    if (productos.length === 0) {
      contenedor.innerHTML =
        '<div class="col text-muted">No hay productos en el inventario.</div>';
      return;
    }

    productos.forEach((prod) => {
      // Verificamos si category existe para evitar errores en productos mal cargados
      const nombreCategoria = prod.category
        ? prod.category.name
        : "Sin categoría";

      contenedor.innerHTML += `
                <div class="col">
                    <div class="item-card p-3 h-100 d-flex flex-column border-info border-opacity-25">
                        <div class="text-info small fw-bold text-uppercase mb-1">
                            ${nombreCategoria}
                        </div>
                        <h4 class="fw-bold mb-1 text-truncate" title="${prod.name}">${prod.name}</h4>
                        <div class="d-flex justify-content-between text-secondary small mb-3">
                            <span class="fs-6 text-light fw-bold">$${prod.price}</span>
                            <span class="badge bg-secondary">Stock: ${prod.quantity}</span>
                        </div>
                        
                        <div class="d-flex gap-2 mt-auto">
                            <button class="btn btn-sm btn-outline-light flex-grow-1">✏️ Editar</button>
                            <button class="btn btn-sm btn-outline-danger flex-grow-1" onclick="eliminarProducto(${prod.id})">🗑️ Borrar</button>
                        </div>
                    </div>
                </div>
            `;
    });
  } catch (error) {
    console.error("Error al cargar productos:", error);
  }
}

// --- FUNCIONES DE ESCRITURA (POST / DELETE) ---

async function guardarProducto(evento) {
  evento.preventDefault();

  const nuevoProducto = {
    name: document.getElementById("name").value,
    price: parseFloat(document.getElementById("price").value),
    quantity: parseInt(document.getElementById("quantity").value),
    categoryId: parseInt(document.getElementById("category").value),
  };

  try {
    const respuesta = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoProducto),
    });

    if (respuesta.ok) {
      document.getElementById("product-form").reset();
      await cargarProductos();
    } else {
      const error = await respuesta.json();
      alert("Error: " + (error.error || "Datos inválidos"));
    }
  } catch (error) {
    console.error("Error al guardar:", error);
  }
}

async function eliminarProducto(id) {
  if (confirm("¿Estás seguro de eliminar este producto del stock?")) {
    try {
      await fetch(`${API_URL}/products/${id}`, { method: "DELETE" });
      await cargarProductos();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  }
}
