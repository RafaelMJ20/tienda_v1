import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Badge, Button } from "../UI/index.jsx";
import { reportService } from "../../services/api.js";
import { ProductSalesStats } from "./ProductSalesStats.jsx";

export const ReportsPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [gainsReport, setGainsReport] = useState(null);
  const [productsReport, setProductsReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, sales, gains, products, inventory, productStats

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const [dash, sales, gains, products, inventory] = await Promise.all([
        reportService.getDashboard(),
        reportService.getSalesReport(),
        reportService.getGainsReport(),
        reportService.getProductsReport(),
        reportService.getInventoryReport(),
      ]);

      setDashboard(dash);
      setSalesReport(sales);
      setGainsReport(gains);
      setProductsReport(products);
      setInventoryReport(inventory);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar los reportes",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = async (content, filename) => {
    // Implementar exportación simple a través de impresión
    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f0f0f0; }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.print();
            window.close();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📊 Reportes y Ganancias</h1>
        <p className="text-gray-600 mt-1">Análisis financiero y de productos</p>
      </div>

      {/* Tabs de navegación */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-6 py-3 font-medium whitespace-nowrap transition ${
              activeTab === "dashboard"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📈 Dashboard
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-6 py-3 font-medium whitespace-nowrap transition ${
              activeTab === "sales"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            💵 Ventas
          </button>
          <button
            onClick={() => setActiveTab("gains")}
            className={`px-6 py-3 font-medium whitespace-nowrap transition ${
              activeTab === "gains"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🎯 Ganancias
          </button>
          <button
            onClick={() => setActiveTab("productStats")}
            className={`px-6 py-3 font-medium whitespace-nowrap transition ${
              activeTab === "productStats"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📦 Ventas por Producto
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`px-6 py-3 font-medium whitespace-nowrap transition ${
              activeTab === "products"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🏆 Productos Top
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-6 py-3 font-medium whitespace-nowrap transition ${
              activeTab === "inventory"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📦 Inventario
          </button>
        </div>
      </div>

      {/* Contenido de las tabs */}
      {activeTab === "dashboard" && (
      <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hoy */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-4 border border-blue-200">
          <p className="text-sm text-gray-600 font-medium">💵 Ingresos Hoy</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            ${dashboard.sales.today.revenue.toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 mt-2">{dashboard.sales.today.count} venta(s)</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-4 border border-green-200">
          <p className="text-sm text-gray-600 font-medium">🎯 Ganancia Hoy</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ${dashboard.sales.today.gain.toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            {dashboard.sales.today.revenue > 0
              ? (
                  (dashboard.sales.today.gain / dashboard.sales.today.revenue) *
                  100
                ).toFixed(1)
              : 0}
            % margen
          </p>
        </div>

        {/* Mes */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-4 border border-purple-200">
          <p className="text-sm text-gray-600 font-medium">💳 Ingresos Mes</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            ${dashboard.sales.month.revenue.toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 mt-2">{dashboard.sales.month.count} venta(s)</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-md p-4 border border-orange-200">
          <p className="text-sm text-gray-600 font-medium">📈 Ganancia Mes</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            ${dashboard.sales.month.gain.toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            {dashboard.sales.month.revenue > 0
              ? (
                  (dashboard.sales.month.gain / dashboard.sales.month.revenue) *
                  100
                ).toFixed(1)
              : 0}
            % margen
          </p>
        </div>
      </div>
      </div>
      )}

      {/* Reporte de Ventas */}
      {activeTab === "sales" && salesReport && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">📊 Reporte de Ventas</h2>
            <Button
              variant="primary"
              onClick={() =>
                exportToPDF(
                  `
                <h1>Reporte de Ventas</h1>
                <div class="section">
                  <h3>Hoy</h3>
                  <p>Ventas: ${salesReport.today.totalSales}</p>
                  <p>Ingresos: $${salesReport.today.totalRevenue.toFixed(2)}</p>
                </div>
                <div class="section">
                  <h3>Esta Semana</h3>
                  <p>Ventas: ${salesReport.week.totalSales}</p>
                  <p>Ingresos: $${salesReport.week.totalRevenue.toFixed(2)}</p>
                  <p>Cambio: ${salesReport.week.change.toFixed(1)}%</p>
                </div>
                <div class="section">
                  <h3>Este Mes</h3>
                  <p>Ventas: ${salesReport.month.totalSales}</p>
                  <p>Ingresos: $${salesReport.month.totalRevenue.toFixed(2)}</p>
                  <p>Cambio: ${salesReport.month.change.toFixed(1)}%</p>
                </div>
                <div class="section">
                  <h3>Este Año</h3>
                  <p>Ventas: ${salesReport.year.totalSales}</p>
                  <p>Ingresos: $${salesReport.year.totalRevenue.toFixed(2)}</p>
                  <p>Cambio: ${salesReport.year.change.toFixed(1)}%</p>
                </div>
              `,
                  "Reporte_Ventas.pdf"
                )
              }
            >
              📥 Descargar PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Hoy */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-3">Hoy</p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Ventas:</span>
                  <span className="font-bold ml-2">{salesReport.today.totalSales}</span>
                </div>
                <div>
                  <span className="text-gray-600">Ingresos:</span>
                  <span className="font-bold ml-2">
                    ${salesReport.today.totalRevenue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Semana */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-3">Semana</p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Ventas:</span>
                  <span className="font-bold ml-2">{salesReport.week.totalSales}</span>
                </div>
                <div>
                  <span className="text-gray-600">Ingresos:</span>
                  <span className="font-bold ml-2">
                    ${salesReport.week.totalRevenue.toFixed(2)}
                  </span>
                </div>
                <div className={`text-xs font-bold ${salesReport.week.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {salesReport.week.change >= 0 ? "📈" : "📉"} {salesReport.week.change.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Mes */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-3">Mes</p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Ventas:</span>
                  <span className="font-bold ml-2">{salesReport.month.totalSales}</span>
                </div>
                <div>
                  <span className="text-gray-600">Ingresos:</span>
                  <span className="font-bold ml-2">
                    ${salesReport.month.totalRevenue.toFixed(2)}
                  </span>
                </div>
                <div className={`text-xs font-bold ${salesReport.month.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {salesReport.month.change >= 0 ? "📈" : "📉"} {salesReport.month.change.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Año */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-3">Año</p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Ventas:</span>
                  <span className="font-bold ml-2">{salesReport.year.totalSales}</span>
                </div>
                <div>
                  <span className="text-gray-600">Ingresos:</span>
                  <span className="font-bold ml-2">
                    ${salesReport.year.totalRevenue.toFixed(2)}
                  </span>
                </div>
                <div className={`text-xs font-bold ${salesReport.year.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {salesReport.year.change >= 0 ? "📈" : "📉"} {salesReport.year.change.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reporte de Ganancias */}
      {activeTab === "gains" && gainsReport && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">💰 Reporte de Ganancias</h2>
            <Button
              variant="primary"
              onClick={() =>
                exportToPDF(
                  `
                <h1>Reporte de Ganancias</h1>
                <div class="section">
                  <h3>Hoy</h3>
                  <p>Ganancia: $${gainsReport.today.totalGain.toFixed(2)}</p>
                  <p>Margen: ${gainsReport.today.marginPercentage.toFixed(1)}%</p>
                </div>
                <div class="section">
                  <h3>Esta Semana</h3>
                  <p>Ganancia: $${gainsReport.week.totalGain.toFixed(2)}</p>
                  <p>Margen: ${gainsReport.week.marginPercentage.toFixed(1)}%</p>
                </div>
                <div class="section">
                  <h3>Este Mes</h3>
                  <p>Ganancia: $${gainsReport.month.totalGain.toFixed(2)}</p>
                  <p>Margen: ${gainsReport.month.marginPercentage.toFixed(1)}%</p>
                </div>
                <div class="section">
                  <h3>Este Año</h3>
                  <p>Ganancia: $${gainsReport.year.totalGain.toFixed(2)}</p>
                  <p>Margen: ${gainsReport.year.marginPercentage.toFixed(1)}%</p>
                </div>
              `,
                  "Reporte_Ganancias.pdf"
                )
              }
            >
              📥 Descargar PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Hoy */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-3">Hoy</p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Ganancia:</span>
                  <span className="font-bold text-green-600 ml-2">
                    ${gainsReport.today.totalGain.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Margen:</span>
                  <span className="font-bold ml-2">{gainsReport.today.marginPercentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Semana */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-3">Semana</p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Ganancia:</span>
                  <span className="font-bold text-green-600 ml-2">
                    ${gainsReport.week.totalGain.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Margen:</span>
                  <span className="font-bold ml-2">{gainsReport.week.marginPercentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Mes */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-3">Mes</p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Ganancia:</span>
                  <span className="font-bold text-green-600 ml-2">
                    ${gainsReport.month.totalGain.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Margen:</span>
                  <span className="font-bold ml-2">{gainsReport.month.marginPercentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Año */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-3">Año</p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Ganancia:</span>
                  <span className="font-bold text-green-600 ml-2">
                    ${gainsReport.year.totalGain.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Margen:</span>
                  <span className="font-bold ml-2">{gainsReport.year.marginPercentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reporte de Productos */}
      {activeTab === "products" && productsReport && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">📦 Reporte de Productos</h2>
            <Button
              variant="primary"
              onClick={() =>
                exportToPDF(
                  `
                <h1>Reporte de Productos (Últimos 30 días)</h1>
                <div class="section">
                  <h3>Top Productos Más Vendidos</h3>
                  <table>
                    <tr><th>Producto</th><th>Cantidad</th><th>Ingresos</th></tr>
                    ${productsReport.topSellers
                      .map(
                        (p) =>
                          `<tr><td>${p.name}</td><td>${p.totalQuantitySold}</td><td>$${p.totalRevenue.toFixed(2)}</td></tr>`
                      )
                      .join("")}
                  </table>
                </div>
                <div class="section">
                  <h3>Top Productos por Ganancia</h3>
                  <table>
                    <tr><th>Producto</th><th>Ganancia</th><th>Ventas</th></tr>
                    ${productsReport.topGainers
                      .map(
                        (p) =>
                          `<tr><td>${p.name}</td><td>$${p.totalGain.toFixed(2)}</td><td>${p.timesSold}</td></tr>`
                      )
                      .join("")}
                  </table>
                </div>
              `,
                  "Reporte_Productos.pdf"
                )
              }
            >
              📥 Descargar PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Vendidos */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top 5 Más Vendidos (30 días)</h3>
              <div className="space-y-3">
                {productsReport.topSellers.map((product, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{idx + 1}. {product.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Cantidad: {product.totalQuantitySold.toFixed(2)}
                        </p>
                      </div>
                      <Badge variant="blue">${product.totalRevenue.toFixed(2)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Ganancias */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💎 Top 5 Mayor Ganancia (30 días)</h3>
              <div className="space-y-3">
                {productsReport.topGainers.map((product, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{idx + 1}. {product.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Vendido {product.timesSold} vez(ces)
                        </p>
                      </div>
                      <Badge variant="green">${product.totalGain.toFixed(2)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Productos no vendidos */}
          {productsReport.notSold.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ⚠️ Productos sin vender (últimos 30 días)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {productsReport.notSold.slice(0, 10).map((product) => (
                  <div key={product.id} className="border border-yellow-200 rounded-lg p-3 bg-yellow-50">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-600 mt-1">Sin actividad reciente</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inventario */}
      {activeTab === "inventory" && inventoryReport && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">📦 Valor del Inventario</h2>
            <Button
              variant="primary"
              onClick={() =>
                exportToPDF(
                  `
                <h1>Reporte de Inventario</h1>
                <div class="section">
                  <p><strong>Valor Total del Inventario:</strong> $${inventoryReport.totalInventoryValue.toFixed(2)}</p>
                  <p><strong>Total de Productos:</strong> ${inventoryReport.totalProducts}</p>
                  <p><strong>Productos con Stock Bajo:</strong> ${inventoryReport.lowStockProducts}</p>
                </div>
                <div class="section">
                  <h3>Top 10 Productos por Valor</h3>
                  <table>
                    <tr><th>Producto</th><th>Cantidad</th><th>Valor</th></tr>
                    ${inventoryReport.topByValue
                      .map((p) => `<tr><td>${p.name}</td><td>${p.quantity}</td><td>$${p.value.toFixed(2)}</td></tr>`)
                      .join("")}
                  </table>
                </div>
              `,
                  "Reporte_Inventario.pdf"
                )
              }
            >
              📥 Descargar PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-4 border border-purple-200">
              <p className="text-sm text-gray-600 font-medium">💰 Valor Total Inventario</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                ${inventoryReport.totalInventoryValue.toFixed(2)}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                En {inventoryReport.totalProducts} producto(s)
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-4 border border-red-200">
              <p className="text-sm text-gray-600 font-medium">⚠️ Stock Bajo</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{inventoryReport.lowStockProducts}</p>
              <p className="text-xs text-gray-600 mt-2">Productos requieren reabastecimiento</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-4 border border-blue-200">
              <p className="text-sm text-gray-600 font-medium">📊 Total Productos</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{inventoryReport.totalProducts}</p>
              <p className="text-xs text-gray-600 mt-2">En inventario activo</p>
            </div>
          </div>

          {/* Top productos por valor */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💎 Top 10 Productos por Valor</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Producto</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Cantidad</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Precio Unitario</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventoryReport.topByValue.map((product, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {product.quantity.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        ${product.purchasePrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        ${product.value.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas de Ventas por Producto */}
      {activeTab === "productStats" && (
        <ProductSalesStats />
      )}
    </div>
  );
};
