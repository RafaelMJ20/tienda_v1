// Obtener todos los productos activos
export const getAllProducts = async (req, res) => {
  try {
    const { prisma } = req;
    const { categoryId, search, sortBy = "name", order = "asc" } = req.query;

    let where = { active: 1 };

    // Filtro por categoría
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    // Búsqueda por nombre
    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        [sortBy]: order.toLowerCase(),
      },
    });

    // Agregar información de stock bajo
    const productsWithAlert = products.map((product) => ({
      ...product,
      lowStock: product.currentStock <= product.minimumStock,
    }));

    res.json({
      success: true,
      data: productsWithAlert,
      count: productsWithAlert.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los productos",
      error: error.message,
    });
  }
};

// Obtener un producto por ID
export const getProductById = async (req, res) => {
  try {
    const { prisma } = req;
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { category: true },
    });

    if (!product || product.active === 0) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    const lowStock = product.currentStock <= product.minimumStock;

    res.json({
      success: true,
      data: {
        ...product,
        lowStock,
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el producto",
      error: error.message,
    });
  }
};

// Crear nuevo producto
export const createProduct = async (req, res) => {
  try {
    const { prisma } = req;
    const {
      name,
      categoryId,
      purchasePrice,
      salePrice,
      currentStock,
      minimumStock,
      unit,
      photo,
    } = req.body;

    // Validaciones
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El nombre del producto es obligatorio",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "La categoría es obligatoria",
      });
    }

    if (purchasePrice === undefined || purchasePrice < 0) {
      return res.status(400).json({
        success: false,
        message: "El precio de compra es obligatorio y debe ser mayor a 0",
      });
    }

    if (salePrice === undefined || salePrice < 0) {
      return res.status(400).json({
        success: false,
        message: "El precio de venta es obligatorio y debe ser mayor a 0",
      });
    }

    if (currentStock === undefined || currentStock < 0) {
      return res.status(400).json({
        success: false,
        message: "El stock actual es obligatorio y no puede ser negativo",
      });
    }

    if (minimumStock === undefined || minimumStock < 0) {
      return res.status(400).json({
        success: false,
        message: "El stock mínimo es obligatorio y no puede ser negativo",
      });
    }

    if (!unit || unit.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "La unidad de medida es obligatoria",
      });
    }

    // Verificar que la categoría existe
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) },
    });

    if (!category || category.active === 0) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        categoryId: parseInt(categoryId),
        purchasePrice: parseFloat(purchasePrice),
        salePrice: parseFloat(salePrice),
        currentStock: parseFloat(currentStock),
        minimumStock: parseFloat(minimumStock),
        unit: unit.trim(),
        photo: photo || null,
      },
      include: { category: true },
    });

    res.status(201).json({
      success: true,
      message: "Producto creado exitosamente",
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el producto",
      error: error.message,
    });
  }
};

// Actualizar producto
export const updateProduct = async (req, res) => {
  try {
    const { prisma } = req;
    const { id } = req.params;
    const {
      name,
      categoryId,
      purchasePrice,
      salePrice,
      currentStock,
      minimumStock,
      unit,
      photo,
    } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product || product.active === 0) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    // Si se cambia la categoría, verificar que existe
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: parseInt(categoryId) },
      });

      if (!category || category.active === 0) {
        return res.status(404).json({
          success: false,
          message: "Categoría no encontrada",
        });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name: name || product.name,
        categoryId: categoryId ? parseInt(categoryId) : product.categoryId,
        purchasePrice:
          purchasePrice !== undefined ? parseFloat(purchasePrice) : product.purchasePrice,
        salePrice: salePrice !== undefined ? parseFloat(salePrice) : product.salePrice,
        currentStock:
          currentStock !== undefined ? parseFloat(currentStock) : product.currentStock,
        minimumStock:
          minimumStock !== undefined ? parseFloat(minimumStock) : product.minimumStock,
        unit: unit || product.unit,
        photo: photo !== undefined ? photo : product.photo,
      },
      include: { category: true },
    });

    res.json({
      success: true,
      message: "Producto actualizado exitosamente",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el producto",
      error: error.message,
    });
  }
};

// Eliminar producto (borrado lógico)
export const deleteProduct = async (req, res) => {
  try {
    const { prisma } = req;
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product || product.active === 0) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    const deletedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { active: 0 },
    });

    res.json({
      success: true,
      message: "Producto eliminado exitosamente",
      data: deletedProduct,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el producto",
      error: error.message,
    });
  }
};

// Obtener productos con stock bajo
export const getLowStockProducts = async (req, res) => {
  try {
    const { prisma } = req;
    const products = await prisma.product.findMany({
      where: {
        active: 1,
        currentStock: {
          lte: prisma.product.fields.minimumStock,
        },
      },
      include: { category: true },
      orderBy: { currentStock: "asc" },
    });

    // Alternativa más simple sin usar campos de Prisma
    const allProducts = await prisma.product.findMany({
      where: { active: 1 },
      include: { category: true },
    });

    const lowStockProducts = allProducts.filter(
      (p) => p.currentStock <= p.minimumStock
    );

    res.json({
      success: true,
      data: lowStockProducts,
      count: lowStockProducts.length,
    });
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener productos con stock bajo",
      error: error.message,
    });
  }
};
