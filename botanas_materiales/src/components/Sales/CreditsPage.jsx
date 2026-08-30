import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Badge, Button, Input } from "../UI/index.jsx";
import { Modal } from "../UI/Modal.jsx";
import { creditService } from "../../services/api.js";

export const CreditsPage = () => {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    notes: "",
  });

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setIsLoading(true);
      const response = await creditService.getSummary();
      setSummary(response);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los créditos",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!summary?.customers) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return summary.customers;
    return summary.customers.filter((customer) =>
      customer.customerName.toLowerCase().includes(term)
    );
  }, [summary, searchTerm]);

  const openCustomerDetails = async (customer) => {
    try {
      setSelectedCustomer(customer);
      setIsDetailsOpen(true);
      const response = await creditService.getByCustomer(customer.customerName);
      setCustomerDetails(response);
      setPaymentForm({
        amount: response.summary.balance > 0 ? response.summary.balance.toFixed(2) : "",
        notes: "",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudieron cargar los detalles del cliente",
      });
    }
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setSelectedCustomer(null);
    setCustomerDetails(null);
    setPaymentForm({ amount: "", notes: "" });
  };

  const handleRegisterPayment = async () => {
    if (!selectedCustomer || !customerDetails) return;

    const amount = Number(paymentForm.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Monto inválido",
        text: "Ingresa un abono mayor a cero",
      });
      return;
    }

    if (amount > customerDetails.summary.balance) {
      Swal.fire({
        icon: "warning",
        title: "Monto excedido",
        text: "El abono no puede ser mayor al saldo pendiente",
      });
      return;
    }

    try {
      setIsLoading(true);
      await creditService.createPayment({
        customerName: selectedCustomer.customerName,
        amount,
        notes: paymentForm.notes || null,
      });

      Swal.fire({
        icon: "success",
        title: "Abono registrado",
        text: "El pago se agregó correctamente",
        timer: 1500,
        showConfirmButton: false,
      });

      const response = await creditService.getByCustomer(selectedCustomer.customerName);
      setCustomerDetails(response);
      setPaymentForm({
        amount: response.summary.balance > 0 ? response.summary.balance.toFixed(2) : "",
        notes: "",
      });
      await loadSummary();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo registrar el abono",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading && !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Cargando créditos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">💳 Créditos y Clientes</h1>
        <p className="text-gray-600 mt-1">Control de saldos pendientes, abonos y liquidaciones</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-600 font-medium">Clientes con deuda</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{summary?.summary.clientsWithDebt || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 font-medium">Saldo total pendiente</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            ${(summary?.summary.totalBalance || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 font-medium">Ventas a crédito/mixtas</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{summary?.summary.totalCreditSales || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600 font-medium">Abonos registrados</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{summary?.summary.totalPayments || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Clientes con saldo pendiente</h2>
            <p className="text-sm text-gray-600">Aquí puedes revisar quién debe y registrar abonos</p>
          </div>
          <div className="w-full md:w-80">
            <Input
              label="Buscar cliente"
              placeholder="Escribe un nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cliente</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Saldo</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Ventas</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Último movimiento</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.customerName} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{customer.customerName}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                      ${customer.balance.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      <div className="flex flex-col items-end gap-1">
                        <span>{customer.salesCount} venta(s)</span>
                        <Badge variant={customer.balance > 0 ? "red" : "green"}>
                          {customer.balance > 0 ? "Pendiente" : "Liquidado"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {customer.lastMovementAt ? formatDate(customer.lastMovementAt) : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="primary" onClick={() => openCustomerDetails(customer)}>
                        Ver / Abonar
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    No hay clientes con deuda para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCustomer && customerDetails && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={closeDetails}
          title={`Créditos de ${customerDetails.customerName}`}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-xs text-gray-500">Saldo</p>
                <p className="font-semibold text-red-600">${customerDetails.summary.balance.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-xs text-gray-500">Crédito generado</p>
                <p className="font-semibold text-blue-700">${customerDetails.summary.totalCreditGenerated.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-xs text-gray-500">Abonos</p>
                <p className="font-semibold text-green-700">${customerDetails.summary.totalPayments.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-xs text-gray-500">Ventas</p>
                <p className="font-semibold">{customerDetails.summary.salesCount}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Historial de ventas</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {customerDetails.sales.length > 0 ? (
                  customerDetails.sales.map((sale) => (
                    <div key={sale.id} className="p-3 border border-gray-200 rounded-md bg-white">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{formatDate(sale.saleDate)}</p>
                          <p className="text-sm text-gray-600">
                            Total: ${sale.total.toFixed(2)} · Pagado: ${sale.amountPaid.toFixed(2)} · Pendiente: ${sale.creditAmount.toFixed(2)}
                          </p>
                        </div>
                        <Badge variant={sale.paymentMethod === "credit" ? "red" : "blue"}>
                          {sale.paymentMethod === "credit" ? "Crédito" : "Mixto"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No hay ventas registradas para este cliente</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Abonos registrados</h3>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                {customerDetails.payments.length > 0 ? (
                  customerDetails.payments.map((payment) => (
                    <div key={payment.id} className="p-3 border border-gray-200 rounded-md bg-green-50">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{formatDate(payment.paymentDate)}</p>
                          {payment.notes && <p className="text-sm text-gray-600">📝 {payment.notes}</p>}
                        </div>
                        <p className="font-semibold text-green-700">${payment.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Todavía no hay abonos registrados</p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Registrar abono</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Monto"
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                />
                <Input
                  label="Notas"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Opcional"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={closeDetails}>
                  Cerrar
                </Button>
                <Button variant="primary" onClick={handleRegisterPayment} disabled={isLoading}>
                  {isLoading ? "Registrando..." : "Guardar abono"}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};