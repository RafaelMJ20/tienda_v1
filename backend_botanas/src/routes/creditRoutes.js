import { Router } from "express";
import { creditController } from "../controllers/creditController.js";

const router = Router();

router.get("/", creditController.getCreditsSummary);
router.post("/payments", creditController.createPayment);
router.get("/:customerName", creditController.getCreditDetails);

export { router as creditRoutes };