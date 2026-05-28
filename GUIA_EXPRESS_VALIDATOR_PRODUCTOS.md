# Guía paso a paso: validar productos con express-validator

Esta guía explica cómo validar los datos de un producto usando `express-validator` en una API con Express y Prisma.

La idea es separar claramente tres responsabilidades:

1. **Validación de formato**: comprobar que el dato exista, tenga el tipo correcto y cumpla reglas básicas.
2. **Validación de negocio**: comprobar que el dato tenga sentido dentro del dominio de la aplicación, por ejemplo que la categoría exista o que el nombre no esté duplicado.
3. **Manejo de errores**: convertir los errores de validación en una respuesta HTTP limpia y consistente.

---

## 1. Qué resuelve express-validator

`express-validator` te permite declarar reglas de validación directamente sobre `req.body`, `req.params` y `req.query`.

En vez de escribir validaciones manuales dentro de cada ruta, podés crear una lista de reglas reutilizables y reutilizarlas en cualquier endpoint.

Ejemplos típicos:

- `name` no puede venir vacío.
- `price` debe ser un número mayor a 0.
- `quantity` debe ser un entero igual o mayor a 0.
- `categoryId` debe ser un id válido.
- `id` de la URL debe ser un entero positivo.

---

## 2. Instalar la librería

Instalá el paquete en el proyecto:

```bash
npm install express-validator
```

Si todo salió bien, vas a poder importar funciones como `body`, `param` y `validationResult`.

---

## 3. Dónde conviene poner cada pieza

En este proyecto la estructura quedó separada en tres archivos:

- `src/validators/product.validators.js`: contiene las reglas de validación.
- `src/middlewares/validateFields.js`: revisa si hubo errores y responde con un `AppError`.
- `src/routes/products.routes.js`: usa esas validaciones antes de ejecutar la lógica de negocio.

Esa separación es útil porque:

- las reglas quedan reutilizables,
- las rutas quedan más limpias,
- el manejo de errores se vuelve consistente.

---

## 4. Crear un middleware que lea los errores

Después de ejecutar las reglas de `express-validator`, los errores quedan guardados internamente en la request.

Para leerlos, usamos `validationResult(req)`.

La idea del middleware es esta:

```js
import { validationResult } from "express-validator";
import AppError from "../utils/AppError.js";

const validateFields = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const messages = errors
            .array()
            .map((error) => error.msg)
            .join(" | ");

        return next(new AppError(messages, 400));
    }

    next();
};

export default validateFields;
```

### Qué hace este middleware

- Junta todos los errores de validación.
- Si encontró alguno, devuelve un error de negocio con status `400`.
- Si no encontró errores, deja seguir la request.

### Por qué usar `AppError`

Porque ya tenés un sistema propio de errores y podés mantener la respuesta uniforme en toda la API.

---

## 5. Crear las reglas de validación del producto

Acá está la parte central.

En `src/validators/product.validators.js` definís un grupo de reglas reutilizables para cada operación.

Las funciones principales son:

- `createProductValidators`: para crear productos.
- `updateProductValidators`: para actualizar productos.
- `validateProductId`: para validar el `:id` de la URL.

### Ejemplo general

```js
import { body, param } from "express-validator";
import { prisma } from "../db.js";
```

Con eso podés validar campos del body y params, y además consultar la base de datos si necesitás una validación asíncrona.

---

## 6. Validación básica de cada campo

### 6.1 `name`

Para el nombre del producto conviene validar:

- que exista,
- que no esté vacío,
- que tenga una longitud razonable,
- que no se repita.

Ejemplo:

```js
body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .bail()
    .isLength({ min: 3, max: 100 })
    .withMessage("El nombre debe tener entre 3 y 100 caracteres")
    .bail()
    .custom(async (name, { req }) => {
        await checkProductNameExists(name, req);
    }),
```

### Por qué usar `.bail()`

`bail()` le dice a `express-validator` que, si una validación falla, no siga evaluando las siguientes del mismo campo.

Eso evita mensajes duplicados y validaciones innecesarias.

---

### 6.2 `price`

El precio debería ser:

- obligatorio en creación,
- numérico,
- mayor a 0.

Ejemplo:

```js
body("price")
    .notEmpty()
    .withMessage("El precio es obligatorio")
    .bail()
    .isFloat({ gt: 0 })
    .withMessage("El precio debe ser un número mayor a 0")
    .bail()
    .toFloat(),
```

`toFloat()` transforma el valor a número antes de llegar al handler.

---

### 6.3 `quantity`

La cantidad debería ser:

- obligatoria en creación,
- un entero,
- mayor o igual a 0.

Ejemplo:

```js
body("quantity")
    .notEmpty()
    .withMessage("La cantidad es obligatoria")
    .bail()
    .isInt({ min: 0 })
    .withMessage("La cantidad debe ser un entero igual o mayor a 0")
    .bail()
    .toInt(),
```

---

### 6.4 `categoryId`

La categoría debería ser:

- obligatoria en creación,
- un entero positivo,
- existente en la base de datos.

Ejemplo:

```js
body("categoryId")
    .notEmpty()
    .withMessage("La categoría es obligatoria")
    .bail()
    .isInt({ gt: 0 })
    .withMessage("La categoría debe ser un id numérico positivo")
    .bail()
    .toInt()
    .custom(async (categoryId) => {
        await checkCategoryExists(categoryId);
    }),
```

Acá aparecen dos tipos de validación:

- una validación de formato (`isInt`),
- una validación de negocio (`checkCategoryExists`).

---

## 7. Validaciones asíncronas con Prisma

`express-validator` también permite hacer validaciones asíncronas.

Eso sirve cuando necesitás consultar la base de datos antes de aceptar un dato.

### 7.1 Verificar que una categoría exista

```js
const checkCategoryExists = async (categoryId) => {
    const category = await prisma.category.findUnique({
        where: { id: Number(categoryId) },
    });

    if (!category) {
        throw new Error(`La categoría con id ${categoryId} no existe`);
    }
};
```

Si no existe, la función lanza un error y `express-validator` lo registra como error de validación.

### 7.2 Verificar que el nombre no esté duplicado

```js
const checkProductNameExists = async (name, req) => {
    const product = await prisma.product.findUnique({
        where: { name },
    });

    if (product && product.id !== Number(req?.params?.id)) {
        throw new Error(`El producto '${name}' ya existe`);
    }
};
```

Eso es útil para evitar duplicados antes de llegar al `create` o al `update`.

### Importante

Aunque esta validación ya exista, conviene seguir dejando el manejo de `P2002` en el `catch`, porque entre la validación y el insert siempre puede haber una condición de carrera.

---

## 8. Validar parámetros de URL

No solo hay que validar el body.

En rutas como estas:

```http
GET /api/products/:id
PATCH /api/products/:id
DELETE /api/products/:id
```

conviene validar `:id`.

Ejemplo:

```js
export const validateProductId = [
    param("id")
        .isInt({ gt: 0 })
        .withMessage("El id del producto debe ser un número entero positivo")
        .toInt(),
];
```

Esto evita cosas como:

- `GET /api/products/abc`
- `DELETE /api/products/-4`

---

## 9. Usar las validaciones en las rutas

Una vez creadas las reglas, se agregan como middleware antes del handler principal.

Ejemplo para crear un producto:

```js
router.post("/products", createProductValidators, validateFields, async (req, res, next) => {
    try {
        const product = await prisma.product.create({
            data: req.body,
        });

        res.json(product);
    } catch (error) {
        if (error && error.code === "P2002") {
            return next(error);
        }

        next(error);
    }
});
```

### Orden correcto

El orden importa:

1. primero van las validaciones,
2. después el middleware que revisa errores,
3. al final la lógica real del endpoint.

Si invertís el orden, el controlador se ejecuta sin haber validado nada.

---

## 10. Cómo quedan los endpoints validados

En este proyecto la idea es esta:

- `POST /products` usa `createProductValidators`.
- `PATCH /products/:id` usa `updateProductValidators`.
- `GET /products/:id` y `DELETE /products/:id` usan `validateProductId`.

Eso permite que cada endpoint valide solo lo que necesita.

---

## 11. Qué responde la API cuando falla la validación

Si el middleware encuentra errores, responde con `AppError` y status `400`.

Ejemplo de salida esperada:

```json
{
  "error": "El nombre es obligatorio | El precio debe ser un número mayor a 0"
}
```

Eso es mejor que dejar que la ruta falle más adelante con un error más difícil de leer.

---

## 12. Diferencia entre validación y lógica de negocio

Es importante no mezclar todo.

### Validación

Comprueba la forma del dato.

Ejemplos:

- el precio es un número,
- la cantidad no es negativa,
- el id es positivo.

### Lógica de negocio

Comprueba reglas del sistema.

Ejemplos:

- la categoría existe,
- el producto no está duplicado,
- el nombre no puede repetirse.

`express-validator` puede cubrir ambas cosas, pero conviene tener claro cuál regla pertenece a cada categoría.

---

## 13. Buenas prácticas al usar express-validator

### 13.1 Usá `.bail()`

Evita que una misma cadena siga validando cuando ya falló.

### 13.2 Separá validaciones en archivos propios

No metas todas las reglas dentro de la ruta si el proyecto crece.

### 13.3 Mantené mensajes claros

Un buen mensaje de error debe decirle al usuario qué está mal y cómo corregirlo.

### 13.4 Convertí tipos cuando corresponda

`toInt()` y `toFloat()` ayudan a que el handler reciba datos ya transformados.

### 13.5 No dependas solo del frontend

Aunque el formulario ya valide, el backend siempre debe validar otra vez.

---

## 14. Errores comunes

### Error 1: usar `res.json(...)` y luego `next(error)`

Eso provoca doble envío de respuesta.

### Error 2: no llamar a `validateFields`

Si no revisás `validationResult(req)`, las reglas se ejecutan pero los errores no se transforman en respuesta.

### Error 3: validar solo el body y olvidarse de `params`

Las rutas con `:id` también necesitan validación.

### Error 4: no usar `bail()`

Podés terminar con mensajes duplicados o validaciones asíncronas sobre valores inválidos.

### Error 5: mezclar demasiada lógica en la ruta

Si el endpoint se vuelve largo, es mejor mover la validación a archivos separados.

---

## 15. Cómo probarlo

### Crear producto válido

```http
POST /api/products
Content-Type: application/json

{
  "name": "Mouse Logitech",
  "price": 25.5,
  "quantity": 10,
  "categoryId": 1
}
```

### Crear producto inválido

```http
POST /api/products
Content-Type: application/json

{
  "name": "",
  "price": -10,
  "quantity": -1,
  "categoryId": 9999
}
```

La respuesta debería devolver errores de validación.

---

## 16. Cómo extender este patrón a otras entidades

Si después querés validar `categories`, `users` o cualquier otra tabla, repetí la misma estructura:

1. crear un archivo de validators,
2. crear o reutilizar `validateFields`,
3. conectar las reglas en la ruta,
4. dejar la lógica de negocio en el handler o en un servicio.

Ejemplo de nombres posibles:

- `src/validators/category.validators.js`
- `src/validators/user.validators.js`
- `src/middlewares/validateFields.js`

---

## 17. Resumen final

Con `express-validator` vas a lograr:

- menos código repetido,
- validaciones más legibles,
- mensajes de error claros,
- rutas más limpias,
- una API más fácil de mantener.

En este proyecto, la validación de productos quedó dividida así:

- reglas de validación: `src/validators/product.validators.js`
- lectura de errores: `src/middlewares/validateFields.js`
- uso real en endpoints: `src/routes/products.routes.js`

Esa es una base sólida para seguir creciendo sin que la validación se descontrole.
