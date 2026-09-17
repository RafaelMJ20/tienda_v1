const formatDateKey = (date) =>
  date.toLocaleDateString("en-CA", {
    timeZone: "America/Mexico_City",
  });

const parseLocalDate = (dateString, endOfDay = false) =>
  new Date(`${dateString}T${endOfDay ? "23:59:59.999" : "00:00:00"}`);

export const saleController = {
  // Crear una nueva venta
  async createSale(req, res) {
    const {
      notes,
      items,
      paymentMethod = "cash",
      customerName = null,
      amountPaid,
      saleDate,
    } = req.body;

    // Validaciones
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "La venta debe contener al menos un producto" });
    }

    const allowedPaymentMethods = ["cash", "credit", "mixed"];
    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        error: "Método de pago inválido. Usa: cash, credit o mixed",
      });
    }

    try {
      let total = 0;
      let totalGain = 0;
      const saleItemsData = [];

      // Verificar stocks y calcular totales
      for (const item of items) {
        const product = await req.prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          return res.status(404).json({ error: `Producto con ID ${item.productId} no encontrado` });
        }

        if (product.currentStock < item.quantity) {
          return res.status(400).json({
            error: `Stock insuficiente para ${product.name}. Disponible: ${product.currentStock}, Solicitado: ${item.quantity}`,
          });
        }

        // Calcular valores del ítem
        const subtotal = item.quantity * product.salePrice;
        const itemGain = item.quantity * (product.salePrice - product.purchasePrice);

        total += subtotal;
        totalGain += itemGain;

        saleItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.salePrice,
          subtotal,
          gain: itemGain,
        });
      }

      const normalizedCustomerName = typeof customerName === "string" ? customerName.trim() : "";
      const paidAmountValue =
        paymentMethod === "cash"
          ? total
          : paymentMethod === "credit"
            ? 0
            : Number(amountPaid ?? 0);

      if ((paymentMethod === "credit" || paymentMethod === "mixed") && !normalizedCustomerName) {
        return res.status(400).json({
          error: "Debes ingresar el nombre del cliente para ventas a crédito o mixtas",
        });
      }

      if (paymentMethod === "mixed") {
        if (Number.isNaN(paidAmountValue) || paidAmountValue <= 0 || paidAmountValue >= total) {
          return res.status(400).json({
            error: "En pago mixto debes ingresar un monto pagado válido, mayor a 0 y menor al total",
          });
        }
      }

      if (paymentMethod === "credit" && Number.isNaN(paidAmountValue)) {
        return res.status(400).json({ error: "Monto pagado inválido" });
      }

      const creditAmount = Math.max(total - paidAmountValue, 0);

      // Crear la venta (si viene saleDate desde el cliente, usarlo para preservar zona horaria local)
      const saleData = {
        notes,
        paymentMethod,
        customerName: normalizedCustomerName || null,
        amountPaid: paidAmountValue,
        creditAmount,
        total,
        gain: totalGain,
        items: {
          create: saleItemsData,
        },
      };

      if (saleDate) {
        // Intentar parsear la fecha proporcionada
        const parsed = new Date(saleDate);
        if (!isNaN(parsed.getTime())) {
          saleData.saleDate = parsed;
        }
      }

      const sale = await req.prisma.sale.create({
        data: saleData,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Actualizar stock de productos
      for (const item of items) {
        await req.prisma.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });
      }

      res.status(201).json(sale);
    } catch (error) {
      console.error("Error al crear venta:", error);
      res.status(500).json({ error: "Error al crear la venta" });
    }
  },

  // Obtener todas las ventas
  async getSales(req, res) {
    try {
      const { startDate, endDate, search } = req.query;

      const where = { active: 1 };

      // Filtro por rango de fechas
      if (startDate || endDate) {
        where.saleDate = {};
        if (startDate) {
          where.saleDate.gte = parseLocalDate(startDate, false);
        }
        if (endDate) {
          // Añadir un día completo
          const end = parseLocalDate(endDate, false);
          end.setDate(end.getDate() + 1);
          where.saleDate.lt = end;
        }
      }

      const sales = await req.prisma.sale.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          saleDate: "desc",
        },
      });

      // Calcular totales y promedios
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalGain = sales.reduce((sum, sale) => sum + sale.gain, 0);

      res.json({
        data: sales,
        summary: {
          totalSales,
          totalRevenue,
          totalGain,
          averageSale: totalSales > 0 ? totalRevenue / totalSales : 0,
          averageGain: totalSales > 0 ? totalGain / totalSales : 0,
        },
      });
    } catch (error) {
      console.error("Error al obtener ventas:", error);
      res.status(500).json({ error: "Error al obtener las ventas" });
    }
  },

  // Obtener venta por ID
  async getSaleById(req, res) {
    const { id } = req.params;

    try {
      const sale = await req.prisma.sale.findUnique({
        where: { id: parseInt(id) },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!sale) {
        return res.status(404).json({ error: "Venta no encontrada" });
      }

      res.json(sale);
    } catch (error) {
      console.error("Error al obtener venta:", error);
      res.status(500).json({ error: "Error al obtener la venta" });
    }
  },

  // Obtener ventas por rango de fechas
  async getSalesByDateRange(req, res) {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Se requieren startDate y endDate" });
    }

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // Incluir el día completo

      const sales = await req.prisma.sale.findMany({
        where: {
          active: 1,
          saleDate: {
            gte: start,
            lt: end,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          saleDate: "desc",
        },
      });

      // Calcular totales
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalGain = sales.reduce((sum, sale) => sum + sale.gain, 0);

      res.json({
        data: sales,
        summary: {
          totalSales,
          totalRevenue,
          totalGain,
          averageSale: totalSales > 0 ? totalRevenue / totalSales : 0,
          averageGain: totalSales > 0 ? totalGain / totalSales : 0,
        },
      });
    } catch (error) {
      console.error("Error al obtener ventas por rango:", error);
      res.status(500).json({ error: "Error al obtener las ventas" });
    }
  },

  // Obtener ventas por período (día, semana, mes, año)
  async getSalesByPeriod(req, res) {
    const { period } = req.params; // day, week, month, year
    const { date } = req.query; // Fecha de referencia (YYYY-MM-DD)

    try {
      const referenceDate = date ? parseLocalDate(date, false) : new Date();
      let startDate, endDate;

      switch (period) {
        case "day":
          startDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
          break;
        case "week":
          const dayOfWeek = referenceDate.getDay();
          const diff = referenceDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          startDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), diff);
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 7);
          break;
        case "month":
          startDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
          endDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
          break;
        case "year":
          startDate = new Date(referenceDate.getFullYear(), 0, 1);
          endDate = new Date(referenceDate.getFullYear() + 1, 0, 1);
          break;
        default:
          return res.status(400).json({ error: "Período inválido. Use: day, week, month, year" });
      }

      const sales = await req.prisma.sale.findMany({
        where: {
          active: 1,
          saleDate: {
            gte: startDate,
            lt: endDate,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          saleDate: "desc",
        },
      });

      // Calcular totales
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalGain = sales.reduce((sum, sale) => sum + sale.gain, 0);

      res.json({
        data: sales,
        period,
        dateRange: {
          start: formatDateKey(startDate),
          end: formatDateKey(endDate),
        },
        summary: {
          totalSales,
          totalRevenue,
          totalGain,
          averageSale: totalSales > 0 ? totalRevenue / totalSales : 0,
          averageGain: totalSales > 0 ? totalGain / totalSales : 0,
        },
      });
    } catch (error) {
      console.error("Error al obtener ventas por período:", error);
      res.status(500).json({ error: "Error al obtener las ventas" });
    }
  },

  // Eliminar venta (soft delete)
  async deleteSale(req, res) {
    const { id } = req.params;

    try {
      const sale = await req.prisma.sale.findUnique({
        where: { id: parseInt(id) },
        include: { items: true },
      });

      if (!sale) {
        return res.status(404).json({ error: "Venta no encontrada" });
      }

      // Restaurar stock de productos
      for (const item of sale.items) {
        await req.prisma.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              increment: item.quantity,
            },
          },
        });
      }

      // Soft delete
      const deletedSale = await req.prisma.sale.update({
        where: { id: parseInt(id) },
        data: { active: 0 },
      });

      res.json({ message: "Venta eliminada exitosamente", data: deletedSale });
    } catch (error) {
      console.error("Error al eliminar venta:", error);
      res.status(500).json({ error: "Error al eliminar la venta" });
    }
  },
};
