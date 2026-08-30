import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Badge } from "../UI/index.jsx";
import { reportService } from "../../services/api.js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

export const ProductSalesStats = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState("month");
  const [chartType, setChartType] = useState("bar"); // bar, line, table
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  useEffect(() => {
    loadProductStats();
  }, [period, customStartDate, customEndDate]);

  const loadProductStats = async () => {
    try {
      let effectivePeriod = period;
      let startDate = null;
      let endDate = null;
      let groupByDay = false;

      // Si es rango personalizado, necesitamos ambas fechas
      if (period === "custom") {
        if (!customStartDate || !customEndDate) {
          setData(null);
          return;
        }
        effectivePeriod = "custom";
        startDate = customStartDate;
        endDate = customEndDate;
        groupByDay = true;
      }

      setIsLoading(true);
      const response = await reportService.getProductSalesStats(
        effectivePeriod,
        startDate,
        endDate,
        groupByDay
      );
      setData(response);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar estadísticas de ventas",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "day":
        return "Hoy";
      case "week":
        return "Esta Semana";
      case "month":
        return "Este Mes";
      case "year":
        return "Este Año";
      case "custom":
        return "Rango Personalizado";
      default:
        return "Este Mes";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Cargando estadísticas...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📦 Cantidad de Ventas por Producto</h1>
          <p className="text-gray-600 mt-1">Selecciona un período para ver las estadísticas</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Selector de período */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="day">Hoy</option>
                <option value="week">Esta Semana</option>
                <option value="month">Este Mes</option>
                <option value="year">Este Año</option>
                <option value="custom">Rango Personalizado</option>
              </select>
            </div>

            {/* Inputs de fecha personalizada */}
            {period === "custom" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>

          {period === "custom" && (!customStartDate || !customEndDate) && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                ℹ️ Completa ambas fechas para ver las estadísticas agrupadas por día
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📦 Cantidad de Ventas por Producto</h2>

        {/* Controles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selector de período */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">Hoy</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mes</option>
              <option value="year">Este Año</option>
              <option value="custom">Rango Personalizado</option>
            </select>
          </div>

          {/* Inputs de fecha personalizada */}
          {period === "custom" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Selector de tipo de gráfico */}
          {!data?.groupByDay && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Vista</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bar">Gráfico de Barras</option>
                <option value="line">Líneas</option>
                <option value="table">Tabla Detallada</option>
              </select>
            </div>
          )}

          {/* Resumen rápido */}
          {data && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <p className="text-xs text-gray-600 mb-1">
                {data.groupByDay ? "Total Período" : "Total Período"}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {data.groupByDay
                  ? data.summary.totalQuantitySold.toFixed(2)
                  : data.summary.totalQuantitySold.toFixed(2)}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {data.groupByDay ? `${data.summary.totalDays} días` : `${data.summary.totalProducts} productos`}
              </p>
            </div>
          )}
        </div>

        {/* Período mostrado */}
        <div className="mt-4 text-sm text-gray-600">
          <span className="font-medium">{getPeriodLabel()}:</span> {data.startDate} a {data.endDate}
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      {!data?.groupByDay && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 font-medium">Productos Vendidos</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{data.summary.totalProducts}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 font-medium">Total Cantidad</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{data.summary.totalQuantitySold.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-600 font-medium">Ingresos</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">${data.summary.totalRevenue.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
            <p className="text-sm text-gray-600 font-medium">Ganancia Total</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">${data.summary.totalGain.toFixed(2)}</p>
          </div>
        </div>
      )}

      {data?.groupByDay && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 font-medium">Total Días</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{data.summary.totalDays}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 font-medium">Total Ventas</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{data.summary.totalSales}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-600 font-medium">Total Cantidad</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">{data.summary.totalQuantitySold.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500">
            <p className="text-sm text-gray-600 font-medium">Ingresos</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">${data.summary.totalRevenue.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
            <p className="text-sm text-gray-600 font-medium">Ganancia Total</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">${data.summary.totalGain.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Vista por Día (Rango Personalizado) */}
      {data?.groupByDay && data.dailyData && data.dailyData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Ventas por Día</h3>
          <div className="space-y-4">
            {data.dailyData.map((dayData) => (
              <div key={dayData.date} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Fecha</p>
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(dayData.date).toLocaleDateString("es-ES", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Cantidad Vendida</p>
                    <p className="text-lg font-bold text-blue-600">{dayData.totalQuantity.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Ingresos</p>
                    <p className="text-lg font-bold text-green-600">${dayData.totalRevenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Ganancia</p>
                    <p className="text-lg font-bold text-orange-600">${dayData.totalGain.toFixed(2)}</p>
                  </div>
                </div>

                {/* Productos de este día */}
                {dayData.products.length > 0 && (
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <p className="font-semibold text-gray-700 mb-2">Productos ({dayData.products.length}):</p>
                    <div className="space-y-1">
                      {dayData.products.map((product) => (
                        <div key={product.id} className="flex justify-between text-xs text-gray-600">
                          <span>
                            {product.name} - {product.totalQuantitySold.toFixed(2)} {product.unit}
                          </span>
                          <span className="font-medium">
                            ${product.totalRevenue.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Resumen consolidado del rango */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h4 className="text-base font-bold text-gray-900 mb-4">📊 Totales del Rango</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <p className="text-xs text-gray-600 font-medium">Total Días</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{data.summary.totalDays}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <p className="text-xs text-gray-600 font-medium">Total Ventas</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{data.summary.totalSales}</p>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                <p className="text-xs text-gray-600 font-medium">Cantidad Vendida</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{data.summary.totalQuantitySold.toFixed(2)}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <p className="text-xs text-gray-600 font-medium">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600 mt-1">${data.summary.totalRevenue.toFixed(2)}</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <p className="text-xs text-gray-600 font-medium">Ganancia Total</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">${data.summary.totalGain.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumen consolidado por Producto (Rango Personalizado) */}
      {data?.groupByDay && data.dailyData && data.dailyData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 Resumen por Producto (Rango Completo)</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Producto</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Unidad</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Cantidad Total</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Veces Vendido</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Ingresos</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Ganancia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(() => {
                  // Agregar todos los productos de todos los días
                  const productMap = new Map();
                  
                  data.dailyData.forEach((day) => {
                    day.products.forEach((product) => {
                      if (!productMap.has(product.id)) {
                        productMap.set(product.id, {
                          id: product.id,
                          name: product.name,
                          unit: product.unit,
                          totalQuantitySold: 0,
                          totalRevenue: 0,
                          totalGain: 0,
                          timesSold: 0,
                        });
                      }
                      const p = productMap.get(product.id);
                      p.totalQuantitySold += product.totalQuantitySold;
                      p.totalRevenue += product.totalRevenue;
                      p.totalGain += product.totalGain;
                      p.timesSold += product.timesSold;
                    });
                  });

                  const products = Array.from(productMap.values()).sort(
                    (a, b) => b.totalQuantitySold - a.totalQuantitySold
                  );

                  return products.length > 0 ? (
                    products.map((product, idx) => (
                      <tr key={product.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">{product.name}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{product.unit}</td>
                        <td className="px-6 py-3 text-sm text-gray-900 font-semibold text-right">
                          {product.totalQuantitySold.toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600 text-right">{product.timesSold}</td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-right font-semibold">
                          ${product.totalRevenue.toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-sm text-green-600 text-right font-semibold">
                          ${product.totalGain.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        Sin datos para mostrar
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gráfico o Tabla */}
      {!data?.groupByDay && (
        <>
          {chartType === "bar" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cantidad Vendida por Producto</h3>
          {data.products.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.products}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalQuantitySold" fill="#3b82f6" name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">Sin datos para mostrar</p>
          )}
        </div>
      )}

      {chartType === "line" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencia de Ventas</h3>
          {data.products.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data.products}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalQuantitySold"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Cantidad"
                />
                <Line
                  type="monotone"
                  dataKey="totalRevenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Ingresos"
                  yAxisId="right"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">Sin datos para mostrar</p>
          )}
        </div>
      )}

      {chartType === "table" && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Producto</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Unidad</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Cantidad</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Veces Vendido</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Precio Unitario</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Total Ingresos</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Ganancia</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">% Ganancia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.products.length > 0 ? (
                  data.products.map((product, idx) => {
                    const gainPercentage =
                      product.totalRevenue > 0
                        ? ((product.totalGain / product.totalRevenue) * 100).toFixed(2)
                        : 0;
                    return (
                      <tr key={product.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">{product.name}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{product.unit}</td>
                        <td className="px-6 py-3 text-sm text-gray-900 font-semibold text-right">
                          {product.totalQuantitySold.toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600 text-right">{product.timesSold}</td>
                        <td className="px-6 py-3 text-sm text-gray-600 text-right">
                          ${product.salePrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-right font-semibold">
                          ${product.totalRevenue.toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-sm text-green-600 text-right font-semibold">
                          ${product.totalGain.toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-sm text-right">
                          <Badge variant="green">{gainPercentage}%</Badge>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      Sin datos para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Fila de totales */}
          {data.products.length > 0 && (
            <div className="bg-gray-100 border-t border-gray-300 px-6 py-4 flex justify-end space-x-12">
              <div>
                <p className="text-sm text-gray-600">Total Cantidad:</p>
                <p className="text-lg font-bold text-gray-900">{data.summary.totalQuantitySold.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Ingresos:</p>
                <p className="text-lg font-bold text-gray-900">${data.summary.totalRevenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Ganancia:</p>
                <p className="text-lg font-bold text-green-600">${data.summary.totalGain.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
};
