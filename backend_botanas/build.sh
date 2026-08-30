#!/bin/bash
# Script para ejecutar durante el build en Render

echo "🔄 Aplicando migraciones de Prisma..."
npx prisma migrate deploy

echo "✅ Build completado"
