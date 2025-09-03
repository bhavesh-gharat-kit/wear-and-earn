import AdminEditProduct from '@/components/admin/products-page/edit-product/AdminEditProduct'
import React from 'react'

function page({ params }) {
    return (
        <AdminEditProduct params={params} />
    )
}

export default page