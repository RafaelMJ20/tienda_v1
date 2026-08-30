import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Button, Input, Select, Badge } from "../UI/index.jsx";
import { Modal } from "../UI/Modal.jsx";
import { Table } from "../UI/Table.jsx";
import { productService, categoryService } from "../../services/api.js";

export const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Filtros
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
    sortBy: "name",
    order: "asc",
  });

  // Formulario
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    purchasePrice: "",
    salePrice: "",
    currentStock: "",
    minimumStock: "",
    unit: "kg",
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productService.getAll(filters);
      setProducts(response.data || []);
    } catch (err) {
      console.error("Error al cargar productos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data || []);
    } catch (err) {
      console.error("Error al cargar categorías:", err);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        categoryId: product.categoryId,
        purchasePrice: product.purchasePrice,
        salePrice: product.salePrice,
        currentStock: product.currentStock,
        minimumStock: product.minimumStock,
        unit: product.unit || "kg",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        categoryId: "",
        purchasePrice: "",
        salePrice: "",
        currentStock: "",
        minimumStock: "",
        unit: "kg",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      if (editingProduct) {
        await productService.update(editingProduct.id, formData);
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Producto actualizado exitosamente",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await productService.create(formData);
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Producto creado exitosamente",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      handleCloseModal();
      loadProducts();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Error al guardar el producto",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (product) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `Se eliminará el producto "${product.name}". Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await productService.delete(product.id);
        Swal.fire({
          icon: "success",
          title: "¡Eliminado!",
          text: "Producto eliminado exitosamente",
          timer: 1500,
          showConfirmButton: false,
        });
        loadProducts();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al eliminar el producto",
        });
      }
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
      key: "unit",
      label: "Unidad",
    },
    {
      key: "salePrice",
      label: "Precio Venta",
      render: (row) => `$${row.salePrice.toFixed(2)}`,
    },
    {
      key: "currentStock",
      label: "Stock",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span>{row.currentStock.toFixed(2)}</span>
          {row.lowStock && <Badge variant="red">Bajo</Badge>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Producto
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Buscar"
            placeholder="Buscar por nombre..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Select
            label="Categoría"
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            options={categories.map((cat) => ({
              value: cat.id,
              label: cat.name,
            }))}
          />
          <Select
            label="Ordenar por"
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            options={[
              { value: "name", label: "Nombre" },
              { value: "salePrice", label: "Precio" },
              { value: "currentStock", label: "Stock" },
            ]}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={products}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? "Editar Producto" : "Nuevo Producto"}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      >
        <div className="space-y-4">
          <Input
            label="Nombre del Producto"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label="Categoría"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            options={categories.map((cat) => ({
              value: cat.id,
              label: cat.name,
            }))}
            required
          />
          <Input
            label="Precio de Compra"
            type="number"
            step="0.01"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
            required
          />
          <Input
            label="Precio de Venta"
            type="number"
            step="0.01"
            value={formData.salePrice}
            onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
            required
          />
          <Input
            label="Stock Actual"
            type="number"
            step="0.01"
            value={formData.currentStock}
            onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
            required
          />
          <Input
            label="Stock Mínimo"
            type="number"
            step="0.01"
            value={formData.minimumStock}
            onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
            required
          />
          <Select
            label="Unidad de Medida"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            options={[
              { value: "kg", label: "Kilogramo" },
              { value: "pieza", label: "Pieza" },
            ]}
            required
          />
        </div>
      </Modal>
    </div>
  );
};
