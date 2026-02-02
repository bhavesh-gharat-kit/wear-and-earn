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
  CreditCard,
  Ruler
} from 'lucide-react'
import CreateContext from '@/components/context/createContext'
import toast from 'react-hot-toast'
import LoaderEffect from '@/components/ui/LoaderEffect'
import axios from 'axios'

export default function CartPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addToCartList, setAddtoCartList, fetchUserProductCartDetails, cartLoading } = useContext(CreateContext)
  const [loadingItems, setLoadingItems] = useState(new Set())
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const handleRemoveItemFromCart = async (productId, size = null) => {
    const loadingKey = size ? `remove-${productId}-${size}` : `remove-${productId}`;
    setLoadingItems(prev => new Set(prev.add(loadingKey)))
    try {
      // Include size in the delete request if available
      const url = size 
        ? `/api/cart/${productId}?size=${encodeURIComponent(size)}`
        : `/api/cart/${productId}`;
      
      const response = await axios.delete(url)
      if (response.status === 200) {
        toast.success(response.data.message || "Item removed from cart")
        fetchUserProductCartDetails()
      }
    } catch (error) {
      console.error("Error removing item from cart", error)
      toast.error("Failed to remove item")
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(loadingKey)
        return newSet
      })
    }
  }

  useEffect(()=>{
    console.log(addToCartList)
  },[addToCartList])

  const handleQuantityChange = async (productId, newQuantity, size = null) => {
    if (newQuantity < 1) return
    
    const loadingKey = size ? `quantity-${productId}-${size}` : `quantity-${productId}`;
    setLoadingItems(prev => new Set(prev.add(loadingKey)))
    try {
      const requestData = { quantity: parseInt(newQuantity) };
      
      // Include size in the update request if available
      if (size) {
        requestData.size = size;
      }

      const response = await axios.put(
        `/api/cart/${productId}`,
        requestData,
        { headers: { "Content-Type": "application/json" } }
      )

      if (response.status === 200) {
        fetchUserProductCartDetails()
        toast.success("Quantity updated")
      }
    } catch (error) {
      console.error("Error updating quantity", error)
      toast.error("Failed to update quantity")
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(loadingKey)
        return newSet
      })
    }
  }

  const totalCartPrice = addToCartList?.length >= 1
    ? addToCartList.reduce((total, item) => {
        const { sellingPrice, price, discount } = item.product;
        
        // For cart display: show sellingPrice - discount (no GST yet)
        const basePrice = sellingPrice || price || 0;
        const discountAmount = (basePrice * (Number(discount) || 0)) / 100;
        const finalAmount = basePrice - discountAmount; // Simple: selling price - discount
        
        return total + (finalAmount * item.quantity);
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

    // Validate that all items with sizes have a size selected
    const itemsWithoutSize = addToCartList.filter(item => {
      const hasSizes = item.product.sizes && item.product.sizes.trim() !== '';
      return hasSizes && !item.size;
    });

    if (itemsWithoutSize.length > 0) {
      toast.error("Some items are missing size selection. Please update your cart.");
      return;
    }

    setCheckoutLoading(true)
    router.push('/checkout')
  }

  if (status === "loading" || cartLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 transition-colors">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Please Login</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">You need to be logged in to view your cart.</p>
          <Link 
            href="/login" 
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 transition-colors">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Your cart is empty</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Start shopping to add items to your cart!</p>
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
  <section className="w-full bg-gray-50 dark:bg-gray-900 transition-colors py-8">
      <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link 
              href="/account"
              className="mr-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Cart</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{addToCartList.length} items</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{totalCartPrice.toLocaleString()}</p>
            <button
              onClick={handleProceedToCheckout}
              className="mt-1 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Checkout
            </button>
          </div>
        </div>
      </div>

  <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Cart Items */}
        <div className="flex-1 space-y-3">
          {addToCartList.map((item) => {
            const { id, quantity, productId, product, size, color } = item
            const { images, title, price, sellingPrice, discount, sizes } = product
            const selectedColorImage =
  images?.find(
    (img) =>
      img.color &&
      color &&
      img.color.trim().toLowerCase() === color.trim().toLowerCase()
  )?.imageUrl ||
  images?.[0]?.imageUrl ||
  "/images/brand-logo.png";

            const basePrice = sellingPrice || price || 0;
            const discountAmount = (basePrice * (Number(discount) || 0)) / 100;
            const finalAmount = basePrice - discountAmount;
            const itemTotal = finalAmount * quantity
            const savings = (price - finalAmount) * quantity

            // Check if product has sizes
            const hasSizes = sizes && sizes.trim() !== '';
            const loadingKeyQuantity = size ? `quantity-${productId}-${size}` : `quantity-${productId}`;
            const loadingKeyRemove = size ? `remove-${productId}-${size}` : `remove-${productId}`;

            return (
              <div key={id} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow w-full md:w-[800px] mx-auto">
                <div className="p-4">
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <Image 
  src={selectedColorImage} 
  alt={`${title} - ${color || 'default'}`}
  width={80}
  height={80}
  className="w-20 h-20 object-cover rounded-lg"
/>

                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">{title}</h3>
                      
                      {/* Size Display */}
                      {hasSizes && (
                        <div className="mb-2">
                          {size ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              <Ruler className="h-3 w-3 mr-1" />
                              Size: {size}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                              <Ruler className="h-3 w-3 mr-1" />
                              Size not selected
                            </span>
                          )}
                        </div>
                      )}
                      
                      {color && (
  <div className="mb-2">
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
      Color: {color}
    </span>
  </div>
)}

                      {/* Price Information */}
                      <div className="mb-2">
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">₹{finalAmount.toLocaleString()}</span>
                          {price > finalAmount && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 line-through">₹{price.toLocaleString()}</span>
                          )}
                          {savings > 0 && (
                            <span className="text-xs text-green-600 font-medium">Save ₹{savings.toLocaleString()}</span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Qty:</span>
                          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded">
                            <button
                              onClick={() => handleQuantityChange(productId, quantity - 1, size)}
                              disabled={quantity <= 1 || loadingItems.has(loadingKeyQuantity)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {loadingItems.has(loadingKeyQuantity) ? (
                                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Minus className="h-3 w-3 text-gray-700 dark:text-gray-200" />
                              )}
                            </button>
                            <span className="px-3 py-1 font-medium text-gray-900 dark:text-gray-100 text-sm min-w-[2rem] text-center">{quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(productId, quantity + 1, size)}
                              disabled={loadingItems.has(loadingKeyQuantity)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {loadingItems.has(loadingKeyQuantity) ? (
                                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Plus className="h-3 w-3 text-gray-700 dark:text-gray-200" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveItemFromCart(productId, size)}
                          disabled={loadingItems.has(loadingKeyRemove)}
                          className="inline-flex items-center px-2 py-1 border border-red-300 dark:border-red-400 text-xs font-medium rounded text-red-700 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {loadingItems.has(loadingKeyRemove) ? (
                            <>
                              <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin mr-1"></div>
                              Removing...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
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
        <div className="w-full lg:w-[320px] xl:w-[340px] flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-4 transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Order Summary</h3>
            <div className="space-y-2"> 
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal ({addToCartList.length} items)</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">₹{totalCartPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Delivery Charges</span>
                <span className={`font-medium ${deliveryCharges === 0 ? 'text-green-600' : ''}`}>
                  {deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges.toFixed(2)}`}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-base font-semibold">Total Amount</span>
                  <span className="text-base font-bold text-gray-900 dark:text-gray-100">₹{(totalCartPrice + deliveryCharges).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={handleProceedToCheckout}
                disabled={checkoutLoading}
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {checkoutLoading ? (
                  <>
                    <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Redirecting...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </>
                )}
              </button>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <Package className="h-3 w-3 mr-2 text-green-500" />
                {totalCartPrice > 999 ? 'Free Delivery' : 'Delivery Charges Apply'}
              </div>
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <ShoppingCart className="h-3 w-3 mr-2 text-blue-500" />
                Secure Checkout
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  )
}