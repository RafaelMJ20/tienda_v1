import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { reportService } from "../../services/api.js";

export const DashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [dailyTrend, setDailyTrend] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState(null);
  const [productsReport, setProductsReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para selecciones
  const [daysRange, setDaysRange] = useState(7);
  const [monthsRange, setMonthsRange] = useState(6);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    loadDailyTrend();
  }, [daysRange]);

  useEffect(() => {
    loadMonthlyTrend();
  }, [monthsRange]);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const [dash, products] = await Promise.all([
        reportService.getDashboard(),
        reportService.getProductsReport(),
      ]);
      setDashboard(dash);
      setProductsReport(products);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar el dashboard",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDailyTrend = async () => {
    try {
      const data = await reportService.getDailyTrend(daysRange);
      setDailyTrend(data);
    } catch (err) {
      console.error("Error loading daily trend:", err);
    }
  };

  const loadMonthlyTrend = async () => {
    try {
      const data = await reportService.getMonthlyTrend(monthsRange);
      setMonthlyTrend(data);
    } catch (err) {
      console.error("Error loading monthly trend:", err);
    }
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📊 Panel Principal</h1>
        <p className="text-gray-600 mt-1">Visualización en tiempo real de tu negocio</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Venta del día */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border border-blue-200 hover:shadow-lg transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 font-medium">💵 Venta del Día</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                ${dashboard.sales.today.revenue.toFixed(2)}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {dashboard.sales.today.count} venta(s)
              </p>
            </div>
          </div>
        </div>

        {/* Ganancia del mes */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6 border border-green-200 hover:shadow-lg transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 font-medium">🎯 Ganancia del Mes</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                ${dashboard.sales.month.gain.toFixed(2)}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {((dashboard.sales.month.gain / dashboard.sales.month.revenue) * 100).toFixed(1)}% margen
              </p>
            </div>
          </div>
        </div>

        {/* Stock bajo */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-md p-6 border border-red-200 hover:shadow-lg transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 font-medium">⚠️ Stock Bajo</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {dashboard.inventory.lowStock}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Productos por reabastecer
              </p>
            </div>
          </div>
        </div>

        {/* Total año */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-6 border border-purple-200 hover:shadow-lg transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 font-medium">📈 Ventas del Año</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                ${dashboard.sales.year.revenue.toFixed(2)}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {dashboard.sales.year.count} ventas totales
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Ventas por Día */}
        {dailyTrend && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">📊 Ventas por Día</h2>
              <select
                value={daysRange}
                onChange={(e) => setDaysRange(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>Últimos 7 días</option>
                <option value={15}>Últimos 15 días</option>
                <option value={30}>Últimos 30 días</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrend.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => `$${value.toFixed(2)}`}
                  labelFormatter={(label) => new Date(label).toLocaleDateString("es-ES")}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  dot={false}
                  name="Ingresos"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="gain"
                  stroke="#10b981"
                  dot={false}
                  name="Ganancia"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfica de Productos Más Vendidos */}
        {productsReport && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">🏆 Top 5 Productos Más Vendidos</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={productsReport.topSellers.slice(0, 5).map((p) => ({
                  name: p.name.substring(0, 15),
                  cantidad: p.totalQuantitySold,
                  revenue: p.totalRevenue,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => value.toFixed(2)} />
                <Legend />
                <Bar dataKey="cantidad" fill="#3b82f6" name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Segunda fila de gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Ganancias Mensuales */}
        {monthlyTrend && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">📈 Ganancias Mensuales</h2>
              <select
                value={monthsRange}
                onChange={(e) => setMonthsRange(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={3}>Últimos 3 meses</option>
                <option value={6}>Últimos 6 meses</option>
                <option value={12}>Últimos 12 meses</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrend.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(month) => new Date(month + "-01").toLocaleDateString("es-ES", { month: "short", year: "2-digit" })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => `$${value.toFixed(2)}`}
                  labelFormatter={(label) => new Date(label + "-01").toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                />
                <Legend />
                <Bar dataKey="gain" fill="#10b981" name="Ganancia" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Distribución de Productos */}
        {productsReport && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">💎 Top 5 por Ganancia</h2>
            <div className="space-y-4">
              {productsReport.topGainers.slice(0, 5).map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name.substring(0, 25)}</p>
                      <p className="text-xs text-gray-600">{product.timesSold} venta(s)</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600">${product.totalGain.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resumen de Inventario */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">📦 Resumen de Inventario</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium">Total de Productos</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{dashboard.inventory.products}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium">Valor del Inventario</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              ${dashboard.inventory.value.toFixed(2)}
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium">Productos con Stock Bajo</p>
            <p className="text-2xl font-bold text-red-600 mt-2">{dashboard.inventory.lowStock}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
