"use client";

import { useSession } from "next-auth/react";
import CreateContext from "@/components/context/createContext";
import PlaceOrderDialog from "@/components/forms/PlaceOrderDialog";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import LoaderEffect from "@/components/ui/LoaderEffect";

function CartPage() {
  const { addToCartList, setAddtoCartList, productList, fetchUserProductCartDetails, cartLoading } =
    useContext(CreateContext);

  const session = useSession();
  const { status } = session;
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  const loggedInUserId = session?.data?.user?.id;

  const handleRemoveItemFromCart = async (productId) => {
    try {
      const response = await axios.delete(`/api/cart/${productId}`);

      if (response.status === 200) {
        toast.success(response.data.message || "Item removed from cart");
        fetchUserProductCartDetails();
        return;
      }
    } catch (error) {
      console.error("Internal Error While removing item from cart", error);
      toast.error(error.message || "internal error");
    }
  };

  const handleCartQuantityChange = async (productId, e) => {
    const updatedQuantity = e.target.value;
    try {
      const response = await axios.put(
        `/api/cart/${productId}`,
        { quantity: parseInt(updatedQuantity) },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        fetchUserProductCartDetails();
        toast.success(response.data.message || "Cart Quantity Updated");
        return;
      }
    } catch (error) {
      console.log(
        "Internal Server Error While updating Cart Quantity",
        error?.message
      );
      toast.error("Internal Server Error");
    }
  };

  const totalCartListPrice =
    addToCartList?.length >= 1
      ? addToCartList?.reduce((result, items) => {
          const { sellingPrice, price, discount } = items.product;
          
          // For cart display: show sellingPrice - discount (no GST yet)
          const basePrice = sellingPrice || price || 0;
          const discountAmount = (basePrice * (Number(discount) || 0)) / 100;
          const finalAmount = basePrice - discountAmount; // Simple: selling price - discount
          
          return result + finalAmount * items.quantity;
        }, 0)
      : 0;

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoaderEffect />
        <p className="ml-4">Loading your account...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold mb-4">Please Login to View Cart</h1>
        <a href="/login" className="btn btn-primary">Login</a>
      </div>
    );
  }

  // Show loading while cart data is being fetched
  if (cartLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoaderEffect />
        <p className="ml-4">Loading cart items...</p>
      </div>
    );
  }

  if (!addToCartList || addToCartList.length <= 0) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-gray-600 mb-4">Start shopping to add items to your cart</p>
        <a href="/products" className="btn btn-primary">Shop Now</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 dark:bg-gray-900 py-8">
      <PlaceOrderDialog 
        isOpen={isOrderDialogOpen} 
        onClose={() => setIsOrderDialogOpen(false)} 
        addToCartList={addToCartList} 
        totalAmount={totalCartListPrice}
        type="cart"
      />
  <div className="max-w-7xl mx-auto rounded-box shadow p-6 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-700 transition-colors">
        <section id="cart">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">My Cart</h2>

          {/* Cart Total + Order Button */}
          <div className="flex flex-wrap justify-between items-center mb-4 bg-gray-50 dark:bg-[#232326] rounded-lg p-4 shadow border border-gray-100 dark:border-gray-700 transition-colors">
            <div className="text-lg font-semibold text-primary dark:text-yellow-400">
              Total: ₹ {totalCartListPrice.toLocaleString("en-IN")}
            </div>
            <button
              onClick={() => setIsOrderDialogOpen(true)}
              className="btn btn-success dark:bg-yellow-500 dark:text-gray-900 dark:hover:bg-yellow-400 dark:border-yellow-500 border border-green-600 dark:hover:border-yellow-400 transition-colors"
            >
              Place Order
            </button>
          </div>

          {/* Cart Items */}
          <div className="grid grid-cols-1 md:grid-cols-3 min-lg:grid-cols-4 gap-4">
            {/* Product Card rendering */}

            {addToCartList?.map((product) => {
              const { id, quantity, productId } = product;
              const { images, title, price, sellingPrice, discount } = product.product;
              // Get first image from ProductImage table or use fallback
              const productImage = images && images.length > 0 ? images[0].imageUrl : "/images/brand-logo.png";
              // For cart display: show sellingPrice - discount (no GST yet)
              const basePrice = sellingPrice || price || 0;
              const discountAmount = (basePrice * (Number(discount) || 0)) / 100;
              const finalAmount = basePrice - discountAmount; // Simple: selling price - discount
              return (
                <div key={id} className="card bg-white dark:bg-[#232326] shadow-md border border-gray-100 dark:border-gray-700 transition-colors">
                  <figure className="h-72 w-full bg-gray-100 dark:bg-[#18181b]">
                    <img
                      src={productImage}
                      alt={title}
                      className="h-full w-full object-cover rounded-t-lg"
                    />
                  </figure>
                  <div className="card-body bg-white dark:bg-[#232326] transition-colors rounded-b-lg">
                    <h2 className="card-title text-gray-900 dark:text-gray-100">{title}</h2>
                    <p className="line-through text-gray-500 dark:text-gray-400">
                      ₹{price.toLocaleString("en-IN")}
                    </p>
                    <p className="text-success font-bold dark:text-yellow-400">
                      ₹{finalAmount.toLocaleString("en-IN")}
                    </p>
                    <div className="flex items-center gap-2">
                      <label className="text-gray-700 dark:text-gray-200">Qty:</label>
                      <input
                        onChange={(e) => handleCartQuantityChange(productId, e)}
                        type="number"
                        className="input input-bordered w-20 bg-gray-50 dark:bg-[#18181b] text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary dark:focus:ring-yellow-400 transition-colors"
                        defaultValue={quantity}
                        min={1}
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveItemFromCart(productId)}
                      className="btn btn-outline btn-error mt-3 border border-red-500 dark:border-red-500 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <Toaster />
    </div>
  );
}

export default CartPage;
