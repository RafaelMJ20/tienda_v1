import express from "express";
import * as productController from "../controllers/productController.js";

const router = express.Router();

// Rutas de Productos
router.get("/", productController.getAllProducts);
router.get("/low-stock", productController.getLowStockProducts);
router.get("/:id", productController.getProductById);
router.post("/", productController.createProduct);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

export default router;
