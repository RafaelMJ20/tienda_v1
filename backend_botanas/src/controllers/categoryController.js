// Obtener todas las categorías activas
export const getAllCategories = async (req, res) => {
  try {
    const { prisma } = req;
    const categories = await prisma.category.findMany({
      where: { active: 1 },
      include: {
        products: {
          where: { active: 1 },
          select: { id: true, name: true },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las categorías",
      error: error.message,
    });
  }
};

// Obtener una categoría por ID
export const getCategoryById = async (req, res) => {
  try {
    const { prisma } = req;
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: {
          where: { active: 1 },
        },
      },
    });

    if (!category || category.active === 0) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la categoría",
      error: error.message,
    });
  }
};

// Crear nueva categoría
export const createCategory = async (req, res) => {
  try {
    const { prisma } = req;
    const { name, description } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El nombre de la categoría es obligatorio",
      });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description || null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Categoría creada exitosamente",
      data: category,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "Ya existe una categoría con ese nombre",
      });
    }

    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear la categoría",
      error: error.message,
    });
  }
};

// Actualizar categoría
export const updateCategory = async (req, res) => {
  try {
    const { prisma } = req;
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!category || category.active === 0) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name: name || category.name,
        description: description !== undefined ? description : category.description,
      },
    });

    res.json({
      success: true,
      message: "Categoría actualizada exitosamente",
      data: updatedCategory,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "Ya existe una categoría con ese nombre",
      });
    }

    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar la categoría",
      error: error.message,
    });
  }
};

// Eliminar categoría (borrado lógico)
export const deleteCategory = async (req, res) => {
  try {
    const { prisma } = req;
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!category || category.active === 0) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    // Verificar si hay productos activos en la categoría
    const activeProducts = await prisma.product.findMany({
      where: { categoryId: parseInt(id), active: 1 },
    });

    if (activeProducts.length > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoría porque tiene ${activeProducts.length} producto(s) activo(s)`,
      });
    }

    const deletedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { active: 0 },
    });

    res.json({
      success: true,
      message: "Categoría eliminada exitosamente",
      data: deletedCategory,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la categoría",
      error: error.message,
    });
  }
};
