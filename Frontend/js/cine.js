document.addEventListener("DOMContentLoaded", async () => {
  console.log("Módulo de Cine inicializado. 🎬");

  // 1. Cargar datos iniciales apenas abre la página
  await cargarGeneros();
  await cargarPeliculas();

  // 2. Escuchar cuando el usuario envía el formulario
  document
    .getElementById("movie-form")
    .addEventListener("submit", guardarPelicula);
});

// --- FUNCIONES DE LECTURA (GET) ---

async function cargarGeneros() {
  try {
    const respuesta = await fetch(`${API_URL}/genres`);
    const generos = await respuesta.json();

    const select = document.getElementById("genre");
    select.innerHTML =
      '<option value="" disabled selected>Seleccioná un género...</option>';

    generos.forEach((gen) => {
      select.innerHTML += `<option value="${gen.id}">${gen.name}</option>`;
    });
  } catch (error) {
    console.error("Error al cargar géneros:", error);
  }
}

async function cargarPeliculas() {
  try {
    const respuesta = await fetch(`${API_URL}/movies`);
    const peliculas = await respuesta.json();

    const contenedor = document.getElementById("movies-container");
    contenedor.innerHTML = ""; // Limpiamos el texto de "Cargando..."

    if (peliculas.length === 0) {
      contenedor.innerHTML =
        '<div class="col text-muted">No hay películas en el catálogo.</div>';
      return;
    }

    peliculas.forEach((peli) => {
      contenedor.innerHTML += `
                <div class="col">
                    <div class="item-card p-3 h-100 d-flex flex-column">
                        <div class="text-warning small fw-bold text-uppercase mb-1">
                            ${peli.genre.name}
                        </div>
                        <h4 class="fw-bold mb-1 text-truncate" title="${peli.title}">${peli.title}</h4>
                        <div class="text-secondary small mb-3">
                            <span>Dir: ${peli.director}</span> • 
                            <span>${peli.year}</span> • 
                            <span>${peli.duration} min</span>
                        </div>
                        <p class="text-light small mb-4 flex-grow-1 opacity-75">
                            ${peli.synopsis}
                        </p>
                        <div class="d-flex gap-2 mt-auto">
                            <button class="btn btn-sm btn-outline-light flex-grow-1">✏️ Editar</button>
                            <button class="btn btn-sm btn-outline-danger flex-grow-1" onclick="eliminarPelicula(${peli.id})">🗑️ Borrar</button>
                        </div>
                    </div>
                </div>
            `;
    });
  } catch (error) {
    console.error("Error al cargar películas:", error);
  }
}

// --- FUNCIONES DE ESCRITURA (POST / DELETE) ---

async function guardarPelicula(evento) {
  evento.preventDefault(); // Evita que la página se recargue

  const nuevaPeli = {
    title: document.getElementById("title").value,
    director: document.getElementById("director").value,
    year: parseInt(document.getElementById("year").value),
    duration: parseInt(document.getElementById("duration").value),
    synopsis: document.getElementById("synopsis").value,
    genreId: parseInt(document.getElementById("genre").value),
  };

  try {
    const respuesta = await fetch(`${API_URL}/movies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevaPeli),
    });

    if (respuesta.ok) {
      document.getElementById("movie-form").reset(); // Limpia el formulario
      await cargarPeliculas(); // Recarga la lista
    } else {
      const error = await respuesta.json();
      alert("Error: " + error.error);
    }
  } catch (error) {
    console.error("Error al guardar:", error);
  }
}

async function eliminarPelicula(id) {
  if (confirm("¿Estás seguro de eliminar esta película?")) {
    try {
      await fetch(`${API_URL}/movies/${id}`, { method: "DELETE" });
      await cargarPeliculas(); // Recarga la lista
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  }
}
