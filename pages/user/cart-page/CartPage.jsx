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
      ? addToCartList?.reduce(
          (result, items) =>
            result + items.product.sellingPrice * items.quantity,
          0
        )
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
        <a href="/login-register" className="btn btn-primary">Login</a>
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
    <div>
      <PlaceOrderDialog 
        isOpen={isOrderDialogOpen} 
        onClose={() => setIsOrderDialogOpen(false)} 
        addToCartList={addToCartList} 
        totalAmount={totalCartListPrice}
        type="cart"
      />
      <div className="bg-base-100 rounded-box shadow p-6">
        <section id="cart">
          <h2 className="text-2xl font-bold mb-4">My Cart</h2>

          {/* Cart Total + Order Button */}
          <div className="flex flex-wrap justify-between items-center mb-4">
            <div className="text-lg font-semibold text-primary">
              Total: ₹ {totalCartListPrice.toLocaleString("en-IN")}
            </div>
            <button
              onClick={() => setIsOrderDialogOpen(true)}
              className="btn btn-success"
            >
              Place Order
            </button>
          </div>

          {/* Cart Items */}
          <div className="grid grid-cols-1 md:grid-cols-3 min-lg:grid-cols-4 gap-4">
            {/* Product Card rendering */}

            {addToCartList?.map((product) => {
              const { id, quantity, productId } = product;
              const { mainImage, title, price, sellingPrice } = product.product;
              return (
                <div key={id} className="card bg-base-100 shadow-md">
                  <figure className="h-72 w-full">
                    <img
                      src={mainImage}
                      alt={title}
                      className="h-full w-full"
                    />
                  </figure>
                  <div className="card-body">
                    <h2 className="card-title">{title}</h2>
                    <p className="line-through">
                      ₹{price.toLocaleString("en-IN")}{" "}
                    </p>
                    <p className="text-success font-bold">
                      ₹{sellingPrice.toLocaleString("en-IN")}
                    </p>
                    <div className="flex items-center gap-2">
                      <label>Qty:</label>
                      <input
                        onChange={(e) => handleCartQuantityChange(productId, e)}
                        type="number"
                        className="input input-bordered w-20"
                        defaultValue={quantity}
                        min={1}
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveItemFromCart(productId)}
                      className="btn btn-outline btn-error mt-3"
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
