'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect, useContext } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart, 
  Package, 
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  CreditCard
} from 'lucide-react'
import CreateContext from '@/components/context/createContext'
import toast from 'react-hot-toast'
import LoaderEffect from '@/components/ui/LoaderEffect'
import axios from 'axios'

export default function CartPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addToCartList, setAddtoCartList, fetchUserProductCartDetails, cartLoading } = useContext(CreateContext)

  const handleRemoveItemFromCart = async (productId) => {
    try {
      const response = await axios.delete(`/api/cart/${productId}`)
      if (response.status === 200) {
        toast.success(response.data.message || "Item removed from cart")
        fetchUserProductCartDetails()
      }
    } catch (error) {
      console.error("Error removing item from cart", error)
      toast.error("Failed to remove item")
    }
  }

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return
    
    try {
      const response = await axios.put(
        `/api/cart/${productId}`,
        { quantity: parseInt(newQuantity) },
        { headers: { "Content-Type": "application/json" } }
      )

      if (response.status === 200) {
        fetchUserProductCartDetails()
        toast.success("Quantity updated")
      }
    } catch (error) {
      console.error("Error updating quantity", error)
      toast.error("Failed to update quantity")
    }
  }

  const totalCartPrice = addToCartList?.length >= 1
    ? addToCartList.reduce((total, item) => {
        const productPrice = item.product.productPrice || (item.product.sellingPrice ? item.product.sellingPrice * 0.7 : 0)
        const mlmPrice = item.product.mlmPrice || (item.product.sellingPrice ? item.product.sellingPrice * 0.3 : 0)
        const totalPrice = item.product.sellingPrice || (productPrice + mlmPrice)
        return total + (totalPrice * item.quantity)
      }, 0)
    : 0

  // Calculate shipping charges based on individual product shipping rates
  const shippingCharges = addToCartList?.length >= 1
    ? addToCartList.reduce((sum, item) => {
        const productShipping = item.product.homeDelivery || 0;
        return sum + (productShipping * item.quantity);
      }, 0)
    : 0;

  // Free shipping if subtotal > 999, otherwise use calculated shipping charges
  const deliveryCharges = totalCartPrice > 999 ? 0 : shippingCharges;

  const handleProceedToCheckout = () => {
    if (!session?.user?.id) {
      toast.error("Please login first")
      router.push('/login')
      return
    }

    if (addToCartList.length === 0) {
      toast.error("Your cart is empty")
      return
    }

    router.push('/checkout')
  }

  if (status === "loading" || cartLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your cart.</p>
          <Link 
            href="/login-register" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (!addToCartList || addToCartList.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-500 mb-6">Start shopping to add items to your cart!</p>
          <Link 
            href="/products"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    )
    
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link 
              href="/account"
              className="mr-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Cart</h1>
              <p className="text-gray-600 text-sm">{addToCartList.length} items</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">₹{totalCartPrice.toLocaleString()}</p>
            <button
              onClick={handleProceedToCheckout}
              className="mt-1 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Checkout
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {addToCartList.map((item) => {
            const { id, quantity, productId, product } = item
            const { mainImage, title, price, sellingPrice, productPrice, mlmPrice } = product
            
            // Calculate display prices with fallback
            const displayProductPrice = productPrice || (sellingPrice ? sellingPrice * 0.7 : 0)
            const displayMlmPrice = mlmPrice || (sellingPrice ? sellingPrice * 0.3 : 0)
            const displayTotalPrice = sellingPrice || (displayProductPrice + displayMlmPrice)
            
            const itemTotal = displayTotalPrice * quantity
            const savings = (price - displayTotalPrice) * quantity

            return (
              <div key={id} className="bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <Image 
                        src={mainImage} 
                        alt={title}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">{title}</h3>
                      
                      {/* Price Information */}
                      <div className="mb-2">
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="text-lg font-bold text-gray-900">
                            ₹{displayTotalPrice.toLocaleString()}
                          </span>
                          {price > displayTotalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{price.toLocaleString()}
                            </span>
                          )}
                          {savings > 0 && (
                            <span className="text-xs text-green-600 font-medium">
                              Save ₹{savings.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Product: ₹{displayProductPrice.toLocaleString()} + MLM: ₹{displayMlmPrice.toLocaleString()}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-gray-700">Qty:</span>
                          <div className="flex items-center border border-gray-300 rounded">
                            <button
                              onClick={() => handleQuantityChange(productId, quantity - 1)}
                              disabled={quantity <= 1}
                              className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-3 py-1 font-medium text-gray-900 text-sm min-w-[2rem] text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(productId, quantity + 1)}
                              className="p-1 hover:bg-gray-100 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveItemFromCart(productId)}
                          className="inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ₹{itemTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal ({addToCartList.length} items)</span>
                <span className="font-medium">₹{totalCartPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Charges</span>
                <span className={`font-medium ${deliveryCharges === 0 ? 'text-green-600' : ''}`}>
                  {deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges.toFixed(2)}`}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-base font-semibold">Total Amount</span>
                  <span className="text-base font-bold text-gray-900">₹{(totalCartPrice + deliveryCharges).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={handleProceedToCheckout}
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Proceed to Checkout
              </button>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-xs text-gray-600">
                <Package className="h-3 w-3 mr-2 text-green-500" />
                {totalCartPrice > 999 ? 'Free Delivery' : 'Delivery Charges Apply'}
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <ShoppingCart className="h-3 w-3 mr-2 text-blue-500" />
                Secure Checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}