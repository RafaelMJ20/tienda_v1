const normalizeCustomerName = (name) => name.trim().toLowerCase();

const buildCustomerSummary = (customerName) => ({
  customerName,
  salesCount: 0,
  creditSalesCount: 0,
  totalSales: 0,
  totalCreditGenerated: 0,
  totalPaidAtSale: 0,
  totalPayments: 0,
  balance: 0,
  lastMovementAt: null,
});

const updateLastMovement = (current, candidate) => {
  if (!current) return candidate;
  return new Date(candidate) > new Date(current) ? candidate : current;
};

export const creditController = {
  async getCreditsSummary(req, res) {
    try {
      const sales = await req.prisma.sale.findMany({
        where: {
          active: 1,
          paymentMethod: { in: ["credit", "mixed"] },
          customerName: { not: null },
        },
        orderBy: { saleDate: "desc" },
      });

      const payments = await req.prisma.creditPayment.findMany({
        where: { active: 1 },
        orderBy: { paymentDate: "desc" },
      });

      const customerMap = new Map();

      sales.forEach((sale) => {
        const customerKey = normalizeCustomerName(sale.customerName);
        if (!customerMap.has(customerKey)) {
          customerMap.set(customerKey, buildCustomerSummary(sale.customerName));
        }

        const summary = customerMap.get(customerKey);
        summary.salesCount += 1;
        summary.totalSales += sale.total;
        summary.totalCreditGenerated += sale.creditAmount || 0;
        summary.totalPaidAtSale += sale.amountPaid || 0;
        summary.creditSalesCount += sale.paymentMethod === "credit" ? 1 : 0;
        summary.lastMovementAt = updateLastMovement(summary.lastMovementAt, sale.saleDate);
      });

      payments.forEach((payment) => {
        const customerKey = normalizeCustomerName(payment.customerName);
        if (!customerMap.has(customerKey)) {
          customerMap.set(customerKey, buildCustomerSummary(payment.customerName));
        }

        const summary = customerMap.get(customerKey);
        summary.totalPayments += payment.amount;
        summary.lastMovementAt = updateLastMovement(summary.lastMovementAt, payment.paymentDate);
      });

      const customers = Array.from(customerMap.values())
        .map((customer) => ({
          ...customer,
          balance: Math.max(customer.totalCreditGenerated - customer.totalPayments, 0),
        }))
        .sort((a, b) => b.balance - a.balance);

      const totalBalance = customers.reduce((sum, customer) => sum + customer.balance, 0);
      const totalClients = customers.length;
      const clientsWithDebt = customers.filter((customer) => customer.balance > 0).length;

      res.json({
        summary: {
          totalClients,
          clientsWithDebt,
          totalBalance,
          totalCreditSales: sales.length,
          totalPayments: payments.length,
        },
        customers,
      });
    } catch (error) {
      console.error("Error al obtener resumen de créditos:", error);
      res.status(500).json({ error: "Error al obtener el resumen de créditos" });
    }
  },

  async getCreditDetails(req, res) {
    try {
      const { customerName } = req.params;
      if (!customerName) {
        return res.status(400).json({ error: "Se requiere customerName" });
      }

      const decodedName = decodeURIComponent(customerName);
      const targetKey = normalizeCustomerName(decodedName);

      const sales = await req.prisma.sale.findMany({
        where: {
          active: 1,
          paymentMethod: { in: ["credit", "mixed"] },
          customerName: { not: null },
        },
        include: {
          items: { include: { product: true } },
        },
        orderBy: { saleDate: "desc" },
      });

      const payments = await req.prisma.creditPayment.findMany({
        where: { active: 1 },
        orderBy: { paymentDate: "desc" },
      });

      const customerSales = sales.filter(
        (sale) => normalizeCustomerName(sale.customerName) === targetKey
      );
      const customerPayments = payments.filter(
        (payment) => normalizeCustomerName(payment.customerName) === targetKey
      );

      if (customerSales.length === 0 && customerPayments.length === 0) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }

      const totalSales = customerSales.reduce((sum, sale) => sum + sale.total, 0);
      const totalCreditGenerated = customerSales.reduce((sum, sale) => sum + (sale.creditAmount || 0), 0);
      const totalPayments = customerPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const balance = Math.max(totalCreditGenerated - totalPayments, 0);

      res.json({
        customerName: customerSales[0]?.customerName || customerPayments[0]?.customerName,
        summary: {
          salesCount: customerSales.length,
          paymentsCount: customerPayments.length,
          totalSales,
          totalCreditGenerated,
          totalPayments,
          balance,
        },
        sales: customerSales,
        payments: customerPayments,
      });
    } catch (error) {
      console.error("Error al obtener detalle de crédito:", error);
      res.status(500).json({ error: "Error al obtener el detalle de crédito" });
    }
  },

  async createPayment(req, res) {
    try {
      const { customerName, amount, notes = null } = req.body;

      if (!customerName || !customerName.trim()) {
        return res.status(400).json({ error: "El nombre del cliente es obligatorio" });
      }

      const paymentAmount = Number(amount);
      if (Number.isNaN(paymentAmount) || paymentAmount <= 0) {
        return res.status(400).json({ error: "El monto del abono debe ser mayor a cero" });
      }

      const payment = await req.prisma.creditPayment.create({
        data: {
          customerName: customerName.trim(),
          amount: paymentAmount,
          notes: notes || null,
        },
      });

      res.status(201).json(payment);
    } catch (error) {
      console.error("Error al registrar abono:", error);
      res.status(500).json({ error: "Error al registrar el abono" });
    }
  },
};