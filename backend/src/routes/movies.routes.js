/**
 * @fileoverview Rutas CRUD para la entidad Movie.
 * Endpoints para obtener, crear, actualizar y eliminar películas.
 */

import { Router } from "express";
import { prisma } from "../db.js";
import AppError from "../utils/AppError.js";

/**
 * Router de Express para rutas de películas.
 * @type {import('express').Router}
 */
const router = Router();

/**
 * GET /movies
 * Obtiene todas las películas con sus géneros asociados.
 *
 * @async
 */
router.get("/movies", async (req, res, next) => {
  try {
    const movies = await prisma.movie.findMany({
      include: {
        genre: true,
      },
    });
    res.json(movies);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /movies
 * Crea una nueva película.
 *
 * @async
 */
router.post("/movies", async (req, res, next) => {
  try {
    const { title, director, year, duration, synopsis, genreId } = req.body;

    // Validaciones lógicas básicas
    if (!title || !director || !synopsis) {
      return next(new AppError("Faltan campos obligatorios", 400));
    }

    if (year == null || Number(year) < 1888) {
      return next(
        new AppError("El año debe ser válido y posterior a 1888", 400),
      );
    }

    if (duration == null || Number(duration) <= 0) {
      return next(new AppError("La duración debe ser mayor a 0", 400));
    }

    // Verifica que el género exista
    const genre = await prisma.genre.findUnique({
      where: { id: Number(genreId) },
    });

    if (!genre) {
      return next(
        new AppError(`No se encontró el género con id ${genreId}`, 404),
      );
    }

    // Crea el registro
    const movie = await prisma.movie.create({
      data: req.body,
    });

    res.status(201).json(movie);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /movies/:id
 * Obtiene una película específica por su ID.
 *
 * @async
 */
router.get("/movies/:id", async (req, res, next) => {
  try {
    const movie = await prisma.movie.findUnique({
      where: { id: Number(req.params.id) },
      include: { genre: true },
    });

    if (!movie) {
      return next(new AppError("Película no encontrada", 404));
    }

    res.json(movie);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /movies/:id
 * Actualiza parcialmente una película existente.
 *
 * @async
 */
router.patch("/movies/:id", async (req, res, next) => {
  try {
    const { year, duration, genreId } = req.body;

    if (year != null && Number(year) < 1888) {
      return next(
        new AppError("El año debe ser válido y posterior a 1888", 400),
      );
    }

    if (duration != null && Number(duration) <= 0) {
      return next(new AppError("La duración debe ser mayor a 0", 400));
    }

    if (genreId != null) {
      const genre = await prisma.genre.findUnique({
        where: { id: Number(genreId) },
      });
      if (!genre) {
        return next(
          new AppError(`No se encontró el género con id ${genreId}`, 404),
        );
      }
    }

    const movie = await prisma.movie.update({
      where: { id: Number(req.params.id) },
      data: req.body,
      include: { genre: true },
    });

    res.json(movie);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /movies/:id
 * Elimina una película por su ID.
 *
 * @async
 */
router.delete("/movies/:id", async (req, res, next) => {
  try {
    const movie = await prisma.movie.delete({
      where: { id: Number(req.params.id) },
    });

    // Retornamos el objeto eliminado para confirmar
    res.json(movie);
  } catch (error) {
    next(error);
  }
});

export default router;
