import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Badge } from "../UI/index.jsx";
import { Table } from "../UI/Table.jsx";
import { productService } from "../../services/api.js";

export const LowStockPage = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadLowStockProducts();
  }, []);

  const loadLowStockProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productService.getLowStock();
      setProducts(response.data || []);
    } catch (err) {
      console.error("Error al cargar productos con stock bajo:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Nombre",
    },
    {
      key: "category",
      label: "Categoría",
      render: (row) => row.category?.name || "-",
    },
    {
      key: "currentStock",
      label: "Stock Actual",
      render: (row) => `${row.currentStock.toFixed(2)} ${row.unit}`,
    },
    {
      key: "minimumStock",
      label: "Stock Mínimo",
      render: (row) => `${row.minimumStock.toFixed(2)} ${row.unit}`,
    },
    {
      key: "deficit",
      label: "Déficit",
      render: (row) => {
        const deficit = row.minimumStock - row.currentStock;
        return (
          <span className="text-red-600 font-semibold">
            -{deficit.toFixed(2)} {row.unit}
          </span>
        );
      },
    },
  ];

  const handleEdit = (product) => {
    // Redirigir a productos para editar
    window.location.hash = "#products";
  };

  const handleDelete = (product) => {
    // Implementar si es necesario
  };

  // Show notification on load
  useEffect(() => {
    if (!isLoading && products.length > 0 && isLoading === false && products.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "⚠️ Stock Bajo",
        text: `${products.length} producto(s) tienen stock por debajo del mínimo. Considera hacer pedidos.`,
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 4000,
      });
    }
  }, [products]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Productos con Stock Bajo</h1>
        <div className="text-sm text-gray-600">
          Total: <span className="font-bold text-red-600">{products.length}</span>
        </div>
      </div>

      <Table
        columns={columns}
        data={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
};
