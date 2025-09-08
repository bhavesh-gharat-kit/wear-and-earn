import axios from "axios";
import React, { useState } from "react";
import toast from "react-hot-toast";

function AddStockModal({ productsStockDetails, fetchproductsStockDetails }) {

  // In productTitle i am taking productId for easy update
  const stockFormInitilizer = {
    productTitle: "",
    productInStock: "",
  };

  const [stockForm, setStockForm] = useState(stockFormInitilizer);

  const handleStockFormInput = (e) => {
    const { name, value } = e.target;
    setStockForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlProductStockSubmit = async (e) => {
    e.preventDefault();
    
    // Find the current stock for the selected product
    const selectedProduct = productsStockDetails.find(
      product => product.id.toString() === stockForm.productTitle
    );
    
    if (!selectedProduct) {
      toast.error("Product not found");
      return;
    }

    // Add the new stock to existing stock
    const addAmount = Number(stockForm.productInStock);
    const currentStock = selectedProduct.inStock;
    const newTotalStock = currentStock + addAmount;

    try {
      const response = await axios.put(`/api/admin/stocks`, {
        productTitle: stockForm.productTitle,
        productInStock: newTotalStock
      });
      
      if (response.status == 200) {
        const closeModalBtn = document.getElementById("closeBtn");
        closeModalBtn.click();
        toast.success(`Added ${addAmount} items. New total stock: ${newTotalStock}`, { duration: 2000 });
        setStockForm(stockFormInitilizer);
        setTimeout(() => {
          fetchproductsStockDetails();
        }, 1200);
      }
    } catch (error) {
      console.log("error", error);
      toast.error("Failed to update stock");
    }
  };

  return (
    <dialog id="my_modal_3" className="modal">
      <div className="modal-box dark:bg-gray-800">
        <form method="dialog">
          {/* if there is a button in form, it will close the modal */}
          <button
            id="closeBtn"
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-gray-600 dark:text-gray-300"
          >
            ✕
          </button>
        </form>
        <h3 className="font-bold text-lg py-4 text-gray-900 dark:text-white">Add Product Stocks!</h3>
        <form
          className="space-y-4"
          action="#"
          onSubmit={handlProductStockSubmit}
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
          {/* add quantity */}
          <div>
            <label htmlFor="productInStock" className="text-gray-900 dark:text-gray-100">Quantity to Add</label>
            <input
              type="number"
              name="productInStock"
              min={1}
              placeholder="Enter quantity to add"
              value={stockForm.productInStock}
              onChange={handleStockFormInput}
              required
              className="w-full pl-2 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <button className="btn btn-primary">Add to Stock</button>
        </form>
      </div>
    </dialog>
  );
}

export default AddStockModal;
