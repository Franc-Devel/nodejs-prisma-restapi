/**
 * @fileoverview Configuracion e instancia del cliente Prisma.
 * Centraliza la conexion con la base de datos para reutilizarla en toda la aplicacion.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

/**
 * Instancia unica del cliente Prisma ORM.
 * Gestiona la conexion con la base de datos (MySQL via mysql2 adapter).
 * Se exporta para ser importada y usada en rutas y servicios.
 *
 * @type {PrismaClient}
 */
const adapter = new PrismaMariaDb({
	host: process.env.DATABASE_HOST,
	user: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE_NAME,
	allowPublicKeyRetrieval: true,
	connectionLimit: 5,
});

export const prisma = new PrismaClient({ adapter });
