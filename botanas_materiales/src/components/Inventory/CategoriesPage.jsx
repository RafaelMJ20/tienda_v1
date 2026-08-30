import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Button, Input, Badge } from "../UI/index.jsx";
import { Modal } from "../UI/Modal.jsx";
import { Table } from "../UI/Table.jsx";
import { categoryService } from "../../services/api.js";

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await categoryService.getAll();
      setCategories(response.data || []);
    } catch (err) {
      console.error("Error al cargar categorías:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      if (editingCategory) {
        await categoryService.update(editingCategory.id, formData);
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Categoría actualizada exitosamente",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await categoryService.create(formData);
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Categoría creada exitosamente",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      handleCloseModal();
      loadCategories();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Error al guardar la categoría",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (category) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `Se eliminará la categoría "${category.name}". Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await categoryService.delete(category.id);
        Swal.fire({
          icon: "success",
          title: "¡Eliminado!",
          text: "Categoría eliminada exitosamente",
          timer: 1500,
          showConfirmButton: false,
        });
        loadCategories();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message || "Error al eliminar la categoría",
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
      key: "description",
      label: "Descripción",
      render: (row) => row.description || "-",
    },
    {
      key: "products",
      label: "Productos",
      render: (row) => (
        <Badge variant="blue">
          {row.products?.length || 0} producto(s)
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Categorías</h1>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Categoría
        </Button>
      </div>

      <Table
        columns={columns}
        data={categories}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCategory ? "Editar Categoría" : "Nueva Categoría"}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      >
        <div className="space-y-4">
          <Input
            label="Nombre de la Categoría"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Descripción (Opcional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripción de la categoría"
          />
        </div>
      </Modal>
    </div>
  );
};
