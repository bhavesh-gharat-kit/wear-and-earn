'use client'

import OrderDetailsPage from '@/app/navigations/orders/OrderDetailsPage'
import { useParams } from 'next/navigation'

export default function OrderDetail() {
  const params = useParams()
  const orderId = params?.id

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Order Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300">The order you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    )
  }

  return <OrderDetailsPage orderId={parseInt(orderId)} />
}
