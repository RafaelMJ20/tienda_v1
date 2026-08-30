import { Router } from "express";
import { saleController } from "../controllers/saleController.js";

const router = Router();

// Crear venta
router.post("/", saleController.createSale);

// ⚠️ RUTAS ESPECÍFICAS PRIMERO (antes que /:id)
// Obtener ventas por rango de fechas
router.get("/range", saleController.getSalesByDateRange);

// Obtener ventas por período (día, semana, mes, año)
router.get("/period/:period", saleController.getSalesByPeriod);

// ⚠️ RUTAS GENÉRICAS DESPUÉS
// Obtener todas las ventas (con filtro opcional por rango de fechas)
router.get("/", saleController.getSales);

// Obtener venta por ID
router.get("/:id", saleController.getSaleById);

// Eliminar venta
router.delete("/:id", saleController.deleteSale);

export { router as saleRoutes };
