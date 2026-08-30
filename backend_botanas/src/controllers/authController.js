import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

// Validar que JWT_SECRET esté configurado en producción
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "your-secret-key-change-in-production") {
  console.warn("⚠️  WARNING: JWT_SECRET no está configurado. Esto es inseguro en producción.");
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production environment");
  }
}

const JWT_EXPIRY = "7d";

// Validación de email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validación de fortaleza de contraseña
// Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
const isStrongPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

// Registrar logs de auditoría
const logAudit = async (prisma, action, data) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: data.userId || null,
        email: data.email || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        success: data.success || false,
        reason: data.reason || null,
        details: data.details ? JSON.stringify(data.details) : null,
      },
    });
  } catch (err) {
    console.error("Error al registrar auditlog:", err);
  }
};

export const authController = {
  // Login de usuario
  login: async (req, res) => {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("user-agent");

    try {
      // Validaciones básicas
      if (!email || !password) {
        await logAudit(req.prisma, "LOGIN_ATTEMPT", {
          email: email || "unknown",
          ipAddress,
          userAgent,
          success: false,
          reason: "Email o contraseña vacíos",
        });

        return res.status(400).json({
          status: "error",
          message: "Email y contraseña son requeridos",
        });
      }

      // Validar formato de email
      if (!isValidEmail(email)) {
        await logAudit(req.prisma, "LOGIN_ATTEMPT", {
          email,
          ipAddress,
          userAgent,
          success: false,
          reason: "Email inválido",
        });

        return res.status(400).json({
          status: "error",
          message: "Credenciales inválidas",
        });
      }

      // Buscar usuario
      const user = await req.prisma.user.findUnique({
        where: { email },
      });

      if (!user || user.active === 0) {
        await logAudit(req.prisma, "LOGIN_ATTEMPT", {
          email,
          ipAddress,
          userAgent,
          success: false,
          reason: user ? "Usuario inactivo" : "Usuario no encontrado",
        });

        // No revelar si el usuario existe
        return res.status(401).json({
          status: "error",
          message: "Credenciales inválidas",
        });
      }

      // Verificar contraseña
      const isPasswordValid = await bcryptjs.compare(password, user.password);

      if (!isPasswordValid) {
        await logAudit(req.prisma, "LOGIN_ATTEMPT", {
          userId: user.id,
          email,
          ipAddress,
          userAgent,
          success: false,
          reason: "Contraseña incorrecta",
        });

        return res.status(401).json({
          status: "error",
          message: "Credenciales inválidas",
        });
      }

      // Generar token JWT
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      // Log de login exitoso
      await logAudit(req.prisma, "LOGIN_SUCCESS", {
        userId: user.id,
        email,
        ipAddress,
        userAgent,
        success: true,
      });

      res.status(200).json({
        status: "success",
        message: "Login exitoso",
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      });
    } catch (err) {
      console.error("Error en login:", err);

      await logAudit(req.prisma, "LOGIN_ERROR", {
        email,
        ipAddress,
        userAgent,
        success: false,
        reason: err.message,
      });

      res.status(500).json({
        status: "error",
        message: "Error al iniciar sesión",
      });
    }
  },

  // Registrar nuevo usuario (solo para admin)
  register: async (req, res) => {
    const { email, password, name, role } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    try {
      // Verificar que el usuario autenticado es admin
      if (req.user.role !== "admin") {
        await logAudit(req.prisma, "REGISTER_ATTEMPT", {
          userId: req.user.id,
          email,
          ipAddress,
          success: false,
          reason: "Usuario no es admin",
        });

        return res.status(403).json({
          status: "error",
          message: "Solo administradores pueden crear usuarios",
        });
      }

      // Validar campos requeridos
      if (!email || !password || !name) {
        return res.status(400).json({
          status: "error",
          message: "Email, contraseña y nombre son requeridos",
        });
      }

      // Validar formato de email
      if (!isValidEmail(email)) {
        return res.status(400).json({
          status: "error",
          message: "Email inválido",
        });
      }

      // Validar fortaleza de contraseña
      if (!isStrongPassword(password)) {
        return res.status(400).json({
          status: "error",
          message: "La contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula y número",
        });
      }

      // Verificar que el email no exista
      const existingUser = await req.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        await logAudit(req.prisma, "REGISTER_ATTEMPT", {
          userId: req.user.id,
          email,
          ipAddress,
          success: false,
          reason: "Email ya registrado",
        });

        return res.status(409).json({
          status: "error",
          message: "El email ya está registrado",
        });
      }

      // Validar rol
      const validRoles = ["admin", "vendedor", "consulta"];
      const userRole = validRoles.includes(role) ? role : "vendedor";

      // Encriptar contraseña con costo más alto (más seguro pero más lento)
      const hashedPassword = await bcryptjs.hash(password, 12);

      // Crear usuario
      const newUser = await req.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: userRole,
        },
      });

      // Log de usuario creado exitosamente
      await logAudit(req.prisma, "USER_CREATED", {
        userId: req.user.id,
        email,
        ipAddress,
        success: true,
        details: { newUserId: newUser.id, role: userRole },
      });

      res.status(201).json({
        status: "success",
        message: "Usuario creado exitosamente",
        data: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      });
    } catch (err) {
      console.error("Error en registro:", err);

      await logAudit(req.prisma, "REGISTER_ERROR", {
        userId: req.user?.id,
        email,
        ipAddress,
        success: false,
        reason: err.message,
      });

      res.status(500).json({
        status: "error",
        message: "Error al crear usuario",
      });
    }
  },

  // Obtener datos del usuario autenticado
  getMe: async (req, res) => {
    try {
      const user = await req.prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          active: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "Usuario no encontrado",
        });
      }

      res.status(200).json({
        status: "success",
        data: user,
      });
    } catch (err) {
      console.error("Error al obtener usuario:", err);
      res.status(500).json({
        status: "error",
        message: "Error al obtener datos del usuario",
      });
    }
  },

  // Listar todos los usuarios (solo admin)
  getAllUsers: async (req, res) => {
    try {
      // Verificar que es admin
      if (req.user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "Acceso denegado",
        });
      }

      const users = await req.prisma.user.findMany({
        where: { active: 1 },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.status(200).json({
        status: "success",
        data: users,
      });
    } catch (err) {
      console.error("Error al listar usuarios:", err);
      res.status(500).json({
        status: "error",
        message: "Error al listar usuarios",
      });
    }
  },

  // Actualizar usuario (admin puede actualizar a otros, usuarios pueden actualizar su perfil)
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, role } = req.body;
      const userId = parseInt(id);

      // Verificar permisos
      if (req.user.role !== "admin" && req.user.id !== userId) {
        return res.status(403).json({
          status: "error",
          message: "No tienes permiso para actualizar este usuario",
        });
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (role && req.user.role === "admin") updateData.role = role;

      const updatedUser = await req.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      res.status(200).json({
        status: "success",
        message: "Usuario actualizado exitosamente",
        data: updatedUser,
      });
    } catch (err) {
      console.error("Error al actualizar usuario:", err);
      res.status(500).json({
        status: "error",
        message: "Error al actualizar usuario",
      });
    }
  },

  // Eliminar usuario (soft delete)
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // Solo admin puede eliminar usuarios
      if (req.user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "Solo administradores pueden eliminar usuarios",
        });
      }

      // Evitar auto-eliminación
      if (req.user.id === parseInt(id)) {
        return res.status(400).json({
          status: "error",
          message: "No puedes eliminar tu propia cuenta",
        });
      }

      await req.prisma.user.update({
        where: { id: parseInt(id) },
        data: { active: 0 },
      });

      res.status(200).json({
        status: "success",
        message: "Usuario eliminado exitosamente",
      });
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      res.status(500).json({
        status: "error",
        message: "Error al eliminar usuario",
      });
    }
  },

  // Cambiar contraseña
  changePassword: async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    try {
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          status: "error",
          message: "Contraseña actual y nueva son requeridas",
        });
      }

      // Validar que la nueva contraseña sea fuerte
      if (!isStrongPassword(newPassword)) {
        return res.status(400).json({
          status: "error",
          message: "La nueva contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula y número",
        });
      }

      // No permitir usar la misma contraseña
      if (currentPassword === newPassword) {
        return res.status(400).json({
          status: "error",
          message: "La nueva contraseña debe ser diferente a la actual",
        });
      }

      // Obtener usuario
      const user = await req.prisma.user.findUnique({
        where: { id: req.user.id },
      });

      // Verificar contraseña actual
      const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        await logAudit(req.prisma, "PASSWORD_CHANGE_ATTEMPT", {
          userId: req.user.id,
          email: user.email,
          ipAddress,
          success: false,
          reason: "Contraseña actual incorrecta",
        });

        return res.status(401).json({
          status: "error",
          message: "Contraseña actual incorrecta",
        });
      }

      // Encriptar nueva contraseña con costo más alto
      const hashedPassword = await bcryptjs.hash(newPassword, 12);

      // Actualizar
      await req.prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword },
      });

      // Log de cambio exitoso
      await logAudit(req.prisma, "PASSWORD_CHANGED", {
        userId: req.user.id,
        email: user.email,
        ipAddress,
        success: true,
      });

      res.status(200).json({
        status: "success",
        message: "Contraseña cambiada exitosamente",
      });
    } catch (err) {
      console.error("Error al cambiar contraseña:", err);

      await logAudit(req.prisma, "PASSWORD_CHANGE_ERROR", {
        userId: req.user.id,
        ipAddress,
        success: false,
        reason: err.message,
      });

      res.status(500).json({
        status: "error",
        message: "Error al cambiar contraseña",
      });
    }
  },
};
