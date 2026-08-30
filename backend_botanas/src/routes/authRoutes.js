import express from "express";
import { authController } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { loginLimiter, strictLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Login (público, con rate limiting estricto)
router.post("/login", loginLimiter, authController.login);

// Registro de nuevo usuario (solo admin, con rate limiting estricto)
router.post("/register", authMiddleware.verify, authMiddleware.isAdmin, strictLimiter, authController.register);

// Obtener datos del usuario autenticado
router.get("/me", authMiddleware.verify, authController.getMe);

// Listar todos los usuarios (solo admin)
router.get("/users", authMiddleware.verify, authMiddleware.isAdmin, authController.getAllUsers);

// Actualizar usuario
router.put("/users/:id", authMiddleware.verify, authController.updateUser);

// Eliminar usuario (soft delete)
router.delete("/users/:id", authMiddleware.verify, authMiddleware.isAdmin, authController.deleteUser);

// Cambiar contraseña (con rate limiting estricto)
router.post("/change-password", authMiddleware.verify, strictLimiter, authController.changePassword);

export default router;
