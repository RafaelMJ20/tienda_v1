import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Button, Input, Badge } from "../UI/index.jsx";
import { Modal } from "../UI/Modal.jsx";
import { saleService, productService } from "../../services/api.js";

export const SalesPage = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productService.getAll();
      setProducts(response.data || []);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar los productos",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar productos por búsqueda
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agregar producto al carrito
  const addToCart = (product) => {
    const existingItem = cartItems.find((item) => item.productId === product.id);

    if (existingItem) {
      // Si ya existe, aumentar cantidad en 0.1
      updateCartItemQuantity(product.id, existingItem.quantity + 0.1);
    } else {
      // Agregar nuevo producto
      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          product,
          quantity: 1.0,
          unitPrice: product.salePrice,
          subtotal: product.salePrice,
          gain: product.salePrice - product.purchasePrice,
        },
      ]);
    }
    setSearchTerm("");
  };

  // Actualizar cantidad de item en carrito
  const updateCartItemQuantity = (productId, newQuantity) => {
    // Convertir a número decimal
    newQuantity = typeof newQuantity === "string" ? parseFloat(newQuantity) : newQuantity;
    
    if (isNaN(newQuantity) || newQuantity <= 0) return;

    const product = products.find((p) => p.id === productId);
    if (newQuantity > product.currentStock) {
      Swal.fire({
        icon: "warning",
        title: "Stock insuficiente",
        text: `Solo hay ${product.currentStock.toFixed(2)} disponibles de ${product.name}`,
      });
      return;
    }

    setCartItems(
      cartItems.map((item) => {
        if (item.productId === productId) {
          const newSubtotal = newQuantity * item.unitPrice;
          return {
            ...item,
            quantity: newQuantity,
            subtotal: newSubtotal,
            gain: newQuantity * (item.unitPrice - item.product.purchasePrice),
          };
        }
        return item;
      })
    );
  };

  // Eliminar item del carrito
  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter((item) => item.productId !== productId));
  };

  // Calcular totales
  const calculateTotals = () => {
    const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalGain = cartItems.reduce((sum, item) => sum + item.gain, 0);
    return { total, totalGain };
  };

  const { total, totalGain } = calculateTotals();
  const paidAmountValue = paymentMethod === "cash" ? total : Number(amountPaid || 0);
  const creditAmount = Math.max(total - paidAmountValue, 0);

  // Realizar venta
  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Carrito vacío",
        text: "Agrega productos antes de completar la venta",
      });
      return;
    }

    try {
      setIsLoading(true);

      if ((paymentMethod === "credit" || paymentMethod === "mixed") && !customerName.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Cliente requerido",
          text: "Debes ingresar el nombre del cliente para ventas a crédito o mixtas",
        });
        return;
      }

      if (paymentMethod === "mixed") {
        const paidAmount = Number(amountPaid);
        if (Number.isNaN(paidAmount) || paidAmount <= 0 || paidAmount >= total) {
          Swal.fire({
            icon: "warning",
            title: "Monto inválido",
            text: "En pago mixto debes ingresar un monto pagado mayor a 0 y menor al total",
          });
          return;
        }
      }

      const saleData = {
        notes: notes || null,
        paymentMethod,
        customerName: customerName.trim() || null,
        amountPaid: paymentMethod === "cash" ? total : Number(amountPaid || 0),
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      await saleService.create(saleData);

      Swal.fire({
        icon: "success",
        title: "¡Venta registrada!",
        html: `
          <div class="text-left">
            <p><strong>Total:</strong> $${total.toFixed(2)}</p>
            <p><strong>Ganancia:</strong> $${totalGain.toFixed(2)}</p>
          </div>
        `,
        timer: 2000,
        showConfirmButton: false,
      });

      // Limpiar carrito
      setCartItems([]);
      setNotes("");
      setPaymentMethod("cash");
      setCustomerName("");
      setAmountPaid("");
      setSearchTerm("");
      loadProducts();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Error al registrar la venta",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Limpiar carrito
  const handleClearCart = () => {
    Swal.fire({
      title: "¿Limpiar carrito?",
      text: "Se eliminarán todos los productos del carrito",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, limpiar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        setCartItems([]);
        setNotes("");
        setPaymentMethod("cash");
        setCustomerName("");
        setAmountPaid("");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Registrar Venta</h1>
        <p className="text-gray-600 mt-1">Busca productos y agrega al carrito de ventas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lado izquierdo: Búsqueda de productos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Buscar Producto</h2>
            <Input
              label="Nombre del producto"
              placeholder="Escribe para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          {/* Productos disponibles */}
          {searchTerm && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold mb-4 text-gray-900">Productos encontrados</h3>
              {filteredProducts.length === 0 ? (
                <p className="text-gray-500">No se encontraron productos</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>${product.salePrice.toFixed(2)} c/u</span>
                          <Badge
                            variant={product.currentStock > product.minimumStock ? "green" : "red"}
                          >
                            Stock: {product.currentStock.toFixed(2)} {product.unit}
                          </Badge>
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.currentStock <= 0}
                        className="ml-4 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition"
                      >
                        Agregar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lado derecho: Carrito */}
        <div className="lg:col-span-1 space-y-4">
          {/* Carrito de items */}
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Carrito
              {cartItems.length > 0 && (
                <Badge variant="blue" className="ml-2">
                  {cartItems.length} producto(s)
                </Badge>
              )}
            </h2>

            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Carrito vacío</p>
            ) : (
              <div className="space-y-4">
                {/* Items */}
                <div className="max-h-60 overflow-y-auto space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-sm text-gray-600">${item.unitPrice.toFixed(2)} c/u</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-600 hover:text-red-700 font-semibold"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Cantidad */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateCartItemQuantity(item.productId, item.quantity - 0.1)
                          }
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            updateCartItemQuantity(item.productId, parseFloat(e.target.value) || 0)
                          }
                          className="w-12 text-center border border-gray-300 rounded py-1"
                        />
                        <button
                          onClick={() =>
                            updateCartItemQuantity(item.productId, item.quantity + 0.1)
                          }
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
                        >
                          +
                        </button>
                        <span className="text-sm text-gray-600 flex-1 text-right">
                          ${item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Separador */}
                <hr className="border-gray-300" />

                {/* Resumen */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Ganancia:</span>
                    <span className="text-green-600 font-semibold">${totalGain.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Método de pago:</span>
                    <span className="font-semibold capitalize">
                      {paymentMethod === "cash"
                        ? "Efectivo"
                        : paymentMethod === "credit"
                          ? "Crédito"
                          : "Mixto"}
                    </span>
                  </div>
                  {(paymentMethod === "credit" || paymentMethod === "mixed") && (
                    <div className="flex justify-between text-gray-600">
                      <span>Saldo pendiente:</span>
                      <span className="font-semibold text-red-600">${creditAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-300">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Notas */}
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas opcionales (cliente, observaciones, etc.)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="2"
                />

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de pago
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => {
                        const nextMethod = e.target.value;
                        setPaymentMethod(nextMethod);
                        if (nextMethod === "cash") {
                          setCustomerName("");
                          setAmountPaid("");
                        }
                        if (nextMethod === "credit") {
                          setAmountPaid("0");
                        }
                        if (nextMethod === "mixed" && !amountPaid) {
                          setAmountPaid((total / 2).toFixed(2));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">Efectivo</option>
                      <option value="credit">Crédito</option>
                      <option value="mixed">Pago mixto</option>
                    </select>
                  </div>

                  {(paymentMethod === "credit" || paymentMethod === "mixed") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del cliente
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ingresa el nombre del cliente"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {paymentMethod === "mixed" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monto pagado
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div className="space-y-2">
                  <button
                    onClick={handleCompleteSale}
                    disabled={isLoading || cartItems.length === 0}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-md transition"
                  >
                    {isLoading ? "Registrando..." : "✓ Completar Venta"}
                  </button>
                  <button
                    onClick={handleClearCart}
                    disabled={isLoading || cartItems.length === 0}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold rounded-md transition"
                  >
                    Limpiar Carrito
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
