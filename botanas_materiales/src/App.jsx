import { useState, useEffect } from 'react';
import { Layout } from './components/Layout.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { LoginPage } from './components/Auth/LoginPage.jsx';
import { useUser } from './context/UserContext.jsx';
import { DashboardPage } from './components/Dashboard/DashboardPage.jsx';
import { ProductsPage } from './components/Inventory/ProductsPage.jsx';
import { CategoriesPage } from './components/Inventory/CategoriesPage.jsx';
import { LowStockPage } from './components/Inventory/LowStockPage.jsx';
import { SalesPage } from './components/Sales/SalesPage.jsx';
import { SalesHistoryPage } from './components/Sales/SalesHistoryPage.jsx';
import { CreditsPage } from './components/Sales/CreditsPage.jsx';
import { ReportsPage } from './components/Reports/ReportsPage.jsx';

function App() {
  const { isAuthenticated, isLoading, login, user } = useUser();
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.slice(1) || 'dashboard';
    return hash;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'products';
      setCurrentPage(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  const userRole = user?.role || 'consulta';

  // Determinar qué páginas puede acceder cada rol
  const canAccessPage = (page, role) => {
    const pageRoles = {
      'dashboard': ['admin', 'vendedor', 'consulta'], // todos
      'categories': ['admin'], // solo admin
      'products': ['admin'], // solo admin
      'low-stock': ['admin'], // solo admin
      'sales': ['admin', 'vendedor'], // admin y vendedor
      'sales-history': ['admin', 'vendedor'], // admin y vendedor
      'credits': ['admin', 'vendedor'], // admin y vendedor
      'reports': ['admin', 'vendedor', 'consulta'], // todos
    };
    return pageRoles[page]?.includes(role) ?? false;
  };

  // Verificar permisos antes de renderizar
  if (!canAccessPage(currentPage, userRole)) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div className="text-5xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
            <p className="text-gray-600 mb-4">
              No tienes permiso para acceder a esta página.
            </p>
            <p className="text-sm text-gray-500">
              Tu rol actual: <span className="font-semibold capitalize">{userRole}</span>
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'low-stock':
        return <LowStockPage />;
      case 'sales':
        return <SalesPage />;
      case 'sales-history':
        return <SalesHistoryPage />;
      case 'credits':
        return <CreditsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'products':
      default:
        return <ProductsPage />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
}

export default App;


