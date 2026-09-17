import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Button, Select, Badge } from "../UI/index.jsx";
import { Modal } from "../UI/Modal.jsx";
import { saleService } from "../../services/api.js";

export const SalesHistoryPage = () => {
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  const [filters, setFilters] = useState({
    period: "all",
    customStartDate: "",
    customEndDate: "",
  });

  const [summary, setSummary] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalGain: 0,
    averageSale: 0,
    averageGain: 0,
  });

  useEffect(() => {
    loadSales();
    setCurrentPage(1); // Reset a la página 1 cuando cambian los filtros
  }, [filters]);

  const loadSales = async () => {
    try {
      setIsLoading(true);

      let response;

      if (filters.period === "custom") {
        if (!filters.customStartDate || !filters.customEndDate) {
          setSales([]);
          setSummary({
            totalSales: 0,
            totalRevenue: 0,
            totalGain: 0,
            averageSale: 0,
            averageGain: 0,
          });
          setIsLoading(false);
          return;
        }
        response = await saleService.getByDateRange(
          filters.customStartDate,
          filters.customEndDate
        );
      } else if (filters.period === "all") {
        response = await saleService.getAll();
      } else {
        // Enviar la fecha local del usuario para que el backend calcule correctamente
        // el inicio/fin del período en la zona horaria del usuario
        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const localDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        response = await saleService.getByPeriod(filters.period, localDate);
      }

      setSales(response.data || []);
      setSummary(response.summary || {
        totalSales: 0,
        totalRevenue: 0,
        totalGain: 0,
        averageSale: 0,
        averageGain: 0,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Error al cargar las ventas",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (sale) => {
    setSelectedSale(sale);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedSale(null);
  };

  const handleDeleteSale = async (sale) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `Se eliminará la venta del ${new Date(sale.saleDate).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}. Esta acción no se puede deshacer y el stock se restaurará.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await saleService.delete(sale.id);
        Swal.fire({
          icon: "success",
          title: "¡Eliminada!",
          text: "Venta eliminada exitosamente",
          timer: 1500,
          showConfirmButton: false,
        });
        loadSales();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al eliminar la venta",
        });
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Lógica de paginación
  const totalPages = Math.ceil(sales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSales = sales.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Historial de Ventas</h1>
        <p className="text-gray-600 mt-1">Ver y filtrar todas las ventas registradas</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Período"
            value={filters.period}
            onChange={(e) =>
              setFilters({
                ...filters,
                period: e.target.value,
                customStartDate: "",
                customEndDate: "",
              })
            }
            options={[
              { value: "all", label: "Todas las ventas" },
              { value: "day", label: "Hoy" },
              { value: "week", label: "Esta semana" },
              { value: "month", label: "Este mes" },
              { value: "year", label: "Este año" },
              { value: "custom", label: "Rango personalizado" },
            ]}
          />

          {filters.period === "custom" && (
            <>
              <input
                type="date"
                label="Fecha inicio"
                value={filters.customStartDate}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    customStartDate: e.target.value,
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={filters.customEndDate}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    customEndDate: e.target.value,
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          )}
        </div>
      </div>

      {/* Resumen */}
      {sales.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-4 border border-blue-200">
            <p className="text-sm text-gray-600 font-medium">Total de Ventas</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{summary.totalSales}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-4 border border-green-200">
            <p className="text-sm text-gray-600 font-medium">Ingresos Totales</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              ${summary.totalRevenue.toFixed(2)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-4 border border-purple-200">
            <p className="text-sm text-gray-600 font-medium">Ganancia Total</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              ${summary.totalGain.toFixed(2)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-md p-4 border border-orange-200">
            <p className="text-sm text-gray-600 font-medium">Venta Promedio</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              ${summary.averageSale.toFixed(2)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg shadow-md p-4 border border-pink-200">
            <p className="text-sm text-gray-600 font-medium">Ganancia Promedio</p>
            <p className="text-2xl font-bold text-pink-600 mt-1">
              ${summary.averageGain.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Lista de ventas */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Ventas</h2>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando ventas...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay ventas registradas para este período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Productos
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Pago
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Ganancia
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{formatDate(sale.saleDate)}</p>
                        {sale.notes && (
                          <p className="text-xs text-gray-500 mt-1">📝 {sale.notes}</p>
                        )}
                        {sale.customerName && (
                          <p className="text-xs text-gray-500 mt-1">👤 {sale.customerName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex flex-wrap gap-1">
                        {sale.items && sale.items.length > 0 ? (
                          <>
                            <Badge variant="blue">
                              {sale.items.length} producto(s)
                            </Badge>
                            {sale.items.length <= 2 && (
                              <span className="text-xs">
                                {sale.items.map((item) => item.product.name).join(", ")}
                              </span>
                            )}
                          </>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <Badge
                        variant={
                          sale.paymentMethod === "cash"
                            ? "green"
                            : sale.paymentMethod === "credit"
                              ? "red"
                              : "blue"
                        }
                      >
                        {sale.paymentMethod === "cash"
                          ? "Efectivo"
                          : sale.paymentMethod === "credit"
                            ? "Crédito"
                            : "Mixto"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      ${sale.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">
                      ${sale.gain.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDetails(sale)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Ver
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {sales.length > itemsPerPage && (
        <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1} a {Math.min(endIndex, sales.length)} de {sales.length} ventas
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ← Anterior
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      {selectedSale && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
          title={`Detalles de Venta - ${formatDate(selectedSale.saleDate)}`}
        >
          <div className="space-y-4">
            {selectedSale.notes && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm">
                  <strong>Notas:</strong> {selectedSale.notes}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-xs text-gray-500">Método de pago</p>
                <p className="font-semibold capitalize">
                  {selectedSale.paymentMethod === "cash"
                    ? "Efectivo"
                    : selectedSale.paymentMethod === "credit"
                      ? "Crédito"
                      : selectedSale.paymentMethod === "mixed"
                        ? "Mixto"
                        : "Efectivo"}
                </p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-xs text-gray-500">Cliente</p>
                <p className="font-semibold">{selectedSale.customerName || "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-xs text-gray-500">Pagado</p>
                <p className="font-semibold text-green-700">
                  ${((selectedSale.amountPaid ?? selectedSale.total) || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs text-gray-500">Pendiente</p>
                <p className="font-semibold text-red-700">
                  ${((selectedSale.creditAmount ?? 0) || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-semibold text-blue-700">${selectedSale.total.toFixed(2)}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Productos vendidos:</h3>
              <div className="space-y-2">
                {selectedSale.items && selectedSale.items.length > 0 ? (
                  selectedSale.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.product.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} x ${item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${item.subtotal.toFixed(2)}
                        </p>
                        <p className="text-sm text-green-600">
                          Ganancia: ${item.gain.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No hay items en esta venta</p>
                )}
              </div>
            </div>

            <hr className="border-gray-300" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>${selectedSale.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-300">
                <span>Total:</span>
                <span>${selectedSale.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-green-600">
                <span>Ganancia Total:</span>
                <span>${selectedSale.gain.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
