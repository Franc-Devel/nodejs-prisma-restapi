/**
 * @fileoverview Rutas para la entidad Genre.
 * Endpoints que permiten obtener todos los géneros con sus películas asociadas.
 */

import { Router } from "express";
import { prisma } from "../db.js";

/**
 * Router de Express para rutas de géneros.
 * @type {import('express').Router}
 */
const router = Router();

/**
 * GET /genres
 * Obtiene todos los géneros cinematográficos.
 *
 * @async
 * @param {import('express').Request} req - Objeto de request de Express.
 * @param {import('express').Response} res - Objeto de response de Express.
 * @param {import('express').NextFunction} next - Función para pasar al siguiente middleware.
 *
 * @returns {Promise<void>} Responde con array JSON de géneros.
 */
router.get("/genres", async (req, res, next) => {
  try {
    // Consulta todos los géneros e incluye las películas relacionadas
    const genres = await prisma.genre.findMany({
      include: {
        movies: true,
      },
    });
    // Envía géneros como JSON
    res.json(genres);
  } catch (error) {
    // Propaga el error al middleware de manejo de errores
    next(error);
  }
});

export default router;
