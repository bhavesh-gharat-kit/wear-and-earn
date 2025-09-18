import axios from "axios";
import React, { useState } from "react";
import toast from "react-hot-toast";

function ReduceStockModal({ productsStockDetails, fetchproductsStockDetails }) {
  const stockFormInitilizer = {
    productTitle: "",
    productInStock: "",
  };

  const [stockForm, setStockForm] = useState(stockFormInitilizer);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleStockFormInput = (e) => {
    const { name, value } = e.target;
    setStockForm((prev) => ({ ...prev, [name]: value }));
    
    // When product is selected, find the product to show current stock
    if (name === "productTitle" && value) {
      const product = productsStockDetails.find(p => p.id.toString() === value);
      setSelectedProduct(product);
    }
  };

  const handleProductStockReduce = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      toast.error("Please select a product first");
      return;
    }

    const reduceAmount = Number(stockForm.productInStock);
    const currentStock = selectedProduct.inStock;
    
    if (reduceAmount <= 0) {
      toast.error("Please enter a valid amount to reduce");
      return;
    }
    
    if (reduceAmount > currentStock) {
      toast.error(`Cannot reduce ${reduceAmount} items. Only ${currentStock} items available in stock.`);
      return;
    }

    const newStock = currentStock - reduceAmount;

    try {
      const response = await axios.put(`/api/admin/stocks`, {
        productTitle: stockForm.productTitle,
        productInStock: newStock
      });
      
      if (response.status === 200) {
        const closeModalBtn = document.getElementById("closeReduceBtn");
        closeModalBtn.click();
        toast.success(`Stock reduced by ${reduceAmount}. New stock: ${newStock}`, { duration: 2000 });
        setStockForm(stockFormInitilizer);
        setSelectedProduct(null);
        setTimeout(() => {
          fetchproductsStockDetails();
        }, 1200);
      }
    } catch (error) {
      console.log("Error reducing stock:", error);
      toast.error("Failed to reduce stock");
    }
  };

  return (
    <div id="reduce_stock_modal" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button
          type="button"
          id="closeReduceBtn"
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-gray-600 dark:text-gray-300"
          onClick={() => document.getElementById('reduce_stock_modal').style.display = 'none'}
        >
          ✕
        </button>
        <h3 className="font-bold text-lg py-4 text-gray-900 dark:text-white">Reduce Product Stock!</h3>
        <form
          className="space-y-4"
          action="#"
          onSubmit={handleProductStockReduce}
        >
          {/* select the product */}
          <div>
            <label htmlFor="productTitle" className="text-gray-900 dark:text-gray-100"> Product Title: </label>
            <select
              name="productTitle"
              value={stockForm.productTitle}
              onChange={handleStockFormInput}
              required
              className="w-full pl-2 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="" disabled>
                Select Product:
              </option>
              {productsStockDetails.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title} (Current Stock: {product.inStock})
                </option>
              ))}
            </select>
          </div>

          {/* Current stock display */}
          {selectedProduct && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Current Stock: <span className="font-bold">{selectedProduct.inStock}</span> items
              </p>
            </div>
          )}

          {/* reduce quantity */}
          <div>
            <label htmlFor="productInStock" className="text-gray-900 dark:text-gray-100">Quantity to Reduce</label>
            <input
              type="number"
              name="productInStock"
              min={1}
              max={selectedProduct ? selectedProduct.inStock : undefined}
              placeholder="Enter quantity to reduce"
              value={stockForm.productInStock}
              onChange={handleStockFormInput}
              required
              className="w-full pl-2 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            {selectedProduct && stockForm.productInStock && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                New stock will be: {Math.max(0, selectedProduct.inStock - Number(stockForm.productInStock))} items
              </p>
            )}
          </div>

          <button 
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold shadow"
          >
            Reduce Stock
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReduceStockModal;
