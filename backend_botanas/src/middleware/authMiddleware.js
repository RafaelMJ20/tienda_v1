import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const authMiddleware = {
  // Verificar token JWT
  verify: (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          status: "error",
          message: "Token no proporcionado",
        });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          status: "error",
          message: "Token expirado",
        });
      }

      return res.status(401).json({
        status: "error",
        message: "Token inválido",
      });
    }
  },

  // Verificar que el usuario es admin
  isAdmin: (req, res, next) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Acceso denegado. Solo administradores",
      });
    }
    next();
  },

  // Verificar que es vendedor o admin (puede hacer ventas)
  canSell: (req, res, next) => {
    if (req.user.role === "consulta") {
      return res.status(403).json({
        status: "error",
        message: "Acceso denegado. No tienes permiso para realizar ventas",
      });
    }
    next();
  },

  // Verificar que es admin o vendedor (puede editar inventario)
  canEditInventory: (req, res, next) => {
    if (req.user.role === "consulta") {
      return res.status(403).json({
        status: "error",
        message: "Acceso denegado. Solo puedes consultar",
      });
    }
    next();
  },
};
