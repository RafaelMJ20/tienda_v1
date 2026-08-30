import rateLimit from "express-rate-limit";

// Rate limiting para login - máx 5 intentos por 15 minutos por IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: "Demasiados intentos de login. Intenta de nuevo en 15 minutos.",
  standardHeaders: true, // Retorna info de rate limit en `RateLimit-*` headers
  legacyHeaders: false, // Desactiva `X-RateLimit-*` headers
  skip: (req) => {
    // No aplicar rate limiting a IPs de desarrollo/local (opcional)
    return req.ip === "::1" || req.ip === "127.0.0.1";
  },
  handler: (req, res) => {
    res.status(429).json({
      status: "error",
      message: "Demasiados intentos de login. Intenta de nuevo en 15 minutos.",
      retryAfter: req.rateLimit.resetTime,
    });
  },
});


// Rate limiting estricto para operaciones sensibles (register, cambio de contraseña)
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 intentos
  message: "Demasiados intentos. Intenta de nuevo en 1 hora.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: "error",
      message: "Demasiados intentos en esta acción. Intenta de nuevo en 1 hora.",
      retryAfter: req.rateLimit.resetTime,
    });
  },
});
