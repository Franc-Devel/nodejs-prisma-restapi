/**
 * @fileoverview Rutas para la entidad Category.
 * Endpoints que permiten obtener todas las categorias con sus productos asociados.
 */

import { Router } from "express";
import { prisma } from "../db.js";

/**
 * Router de Express para rutas de categorias.
 * @type {import('express').Router}
 */
const router = Router();

/**
 * GET /categories
 * Obtiene todas las categorias con sus productos asociados.
 *
 * @async
 * @param {import('express').Request} req - Objeto de request de Express.
 * @param {import('express').Response} res - Objeto de response de Express.
 * @param {import('express').NextFunction} next - Funcion para pasar al siguiente middleware (manejo de errores).
 *
 * @returns {Promise<void>} Responde con array JSON de categorias.
 *
 * @example
 * GET /api/categories
 * Response:
 * [
 *   { id: 1, name: "Electronics", products: [...] },
 *   { id: 2, name: "Books", products: [...] }
 * ]
 */
router.get("/categories", async (req, res, next) => {
	try {
		// Consulta todas las categorias e incluye los productos relacionados.
		const categories = await prisma.category.findMany({
			include: {
				products: true,
			},
		});
		// Envia categorias como JSON.
		res.json(categories);
	} catch (error) {
		// Propaga el error al middleware de manejo de errores.
		next(error);
	}
});

export default router;
