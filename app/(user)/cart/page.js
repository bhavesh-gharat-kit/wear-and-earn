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
    ? addToCartList.reduce((total, item) => total + (item.product.sellingPrice * item.quantity), 0)
    : 0

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link 
              href="/account"
              className="mr-4 p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Cart</h1>
              <p className="text-gray-600 mt-1">{addToCartList.length} items in your cart</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">₹{totalCartPrice.toLocaleString()}</p>
            <button
              onClick={handleProceedToCheckout}
              className="mt-2 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="space-y-4">
        {addToCartList.map((item) => {
          const { id, quantity, productId, product } = item
          const { mainImage, title, price, sellingPrice } = product
          const itemTotal = sellingPrice * quantity
          const savings = (price - sellingPrice) * quantity

          return (
            <div key={id} className="bg-white shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start space-x-6">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <Image 
                      src={mainImage} 
                      alt={title}
                      width={96}
                      height={96}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                        
                        {/* Price Information */}
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-gray-900">
                              ₹{sellingPrice.toLocaleString()}
                            </span>
                            {price > sellingPrice && (
                              <span className="text-lg text-gray-500 line-through">
                                ₹{price.toLocaleString()}
                              </span>
                            )}
                          </div>
                          {savings > 0 && (
                            <span className="text-green-600 font-medium">
                              Save ₹{savings.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">Quantity:</span>
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() => handleQuantityChange(productId, quantity - 1)}
                                disabled={quantity <= 1}
                                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="px-4 py-2 font-medium text-gray-900 min-w-[3rem] text-center">
                                {quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(productId, quantity + 1)}
                                className="p-2 hover:bg-gray-100 transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Item Total & Remove */}
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900 mb-2">
                          ₹{itemTotal.toLocaleString()}
                        </p>
                        <button
                          onClick={() => handleRemoveItemFromCart(productId)}
                          className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Cart Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal ({addToCartList.length} items)</span>
            <span className="font-medium">₹{totalCartPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Charges</span>
            <span className="font-medium text-green-600">FREE</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className="text-lg font-semibold">Total Amount</span>
              <span className="text-lg font-bold text-gray-900">₹{totalCartPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={handleProceedToCheckout}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Proceed to Checkout
          </button>
        </div>
      </div>

    </div>
  )
}