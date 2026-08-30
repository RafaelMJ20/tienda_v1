import { useState, useCallback, memo } from "react";
import { useUser } from "../context/UserContext.jsx";
import Swal from "sweetalert2";

const NavLink = memo(({ item, isSidebarOpen }) => (
  <a
    href={item.href}
    className={`flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-800 transition text-sm font-medium ${
      !isSidebarOpen ? "justify-center" : ""
    }`}
    title={!isSidebarOpen ? item.name : undefined}
  >
    <span className="text-xl">{item.icon}</span>
    {isSidebarOpen && <span>{item.name}</span>}
  </a>
));

NavLink.displayName = "NavLink";

const NAV_ITEMS = {
  principal: [
    { name: "Dashboard", icon: "📊", href: "#dashboard" },
  ],
  inventario: [
    { name: "Categorías", icon: "🏷️", href: "#categories" },
    { name: "Productos", icon: "📦", href: "#products" },
    { name: "Stock Bajo", icon: "⚠️", href: "#low-stock" },
  ],
  ventas: [
    { name: "Nueva Venta", icon: "💳", href: "#sales" },
    { name: "Historial", icon: "📊", href: "#sales-history" },
    { name: "Créditos", icon: "🧾", href: "#credits" },
  ],
  reportes: [
    { name: "Reportes", icon: "📈", href: "#reports" },
  ],
};

// Función para determinar si un rol puede acceder a una sección
const canAccessSection = (role, section) => {
  const roleAccess = {
    admin: ["principal", "inventario", "ventas", "reportes"],
    vendedor: ["principal", "ventas", "reportes"],
    consulta: ["principal", "reportes"],
  };
  return roleAccess[role]?.includes(section) ?? false;
};

export const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useUser();

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: "¿Cerrar sesión?",
      text: "¿Estás seguro de que deseas salir?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        window.location.href = "/";
      }
    });
  };

  const userRole = user?.role || "consulta";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-gray-900 text-white shadow-lg transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className={`p-4 flex ${isSidebarOpen ? "justify-between" : "justify-center"} items-center border-b border-gray-800`}>
          {isSidebarOpen && <h1 className="text-xl font-bold">Botanas</h1>}
          <button
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-white transition flex-shrink-0"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto">
          {/* Principal */}
          {canAccessSection(userRole, "principal") && (
            <>
              {isSidebarOpen && (
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Principal</p>
                </div>
              )}
              {NAV_ITEMS.principal.map((item) => (
                <NavLink key={item.name} item={item} isSidebarOpen={isSidebarOpen} />
              ))}
            </>
          )}

          {/* Inventario */}
          {canAccessSection(userRole, "inventario") && (
            <>
              {isSidebarOpen && (
                <div className="px-4 py-2 mt-6 pt-6 border-t border-gray-800">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inventario</p>
                </div>
              )}
              {NAV_ITEMS.inventario.map((item) => (
                <NavLink key={item.name} item={item} isSidebarOpen={isSidebarOpen} />
              ))}
            </>
          )}

          {/* Ventas */}
          {canAccessSection(userRole, "ventas") && (
            <>
              {isSidebarOpen && (
                <div className="px-4 py-2 mt-6 pt-6 border-t border-gray-800">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ventas</p>
                </div>
              )}
              {NAV_ITEMS.ventas.map((item) => (
                <NavLink key={item.name} item={item} isSidebarOpen={isSidebarOpen} />
              ))}
            </>
          )}

          {/* Reportes */}
          {canAccessSection(userRole, "reportes") && (
            <>
              {isSidebarOpen && (
                <div className="px-4 py-2 mt-6 pt-6 border-t border-gray-800">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Reportes</p>
                </div>
              )}
              {NAV_ITEMS.reportes.map((item) => (
                <NavLink key={item.name} item={item} isSidebarOpen={isSidebarOpen} />
              ))}
            </>
          )}

        </nav>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 will-change-[margin-left] ${isSidebarOpen ? "ml-64" : "ml-20"}`}>
        <header className="bg-white shadow-sm">
          <div className="px-8 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Gestor de Inventario</h2>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition"
                title="Cerrar sesión"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Salir
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};
