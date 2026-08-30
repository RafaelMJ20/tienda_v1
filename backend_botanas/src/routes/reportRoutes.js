import { Router } from "express";
import { reportController } from "../controllers/reportController.js";

const router = Router();

// Dashboard general
router.get("/dashboard", reportController.getDashboard);

// Reportes específicos
router.get("/sales", reportController.getSalesReport);
router.get("/gains", reportController.getGainsReport);
router.get("/products", reportController.getProductsReport);
router.get("/inventory", reportController.getInventoryValue);

// Tendencias para gráficas
router.get("/daily-trend", reportController.getDailyTrend);
router.get("/monthly-trend", reportController.getMonthlyTrend);

// Estadísticas de ventas por producto
router.get("/product-sales-stats", reportController.getProductSalesStats);

export { router as reportRoutes };
