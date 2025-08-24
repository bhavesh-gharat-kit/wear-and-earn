import OrderDetailsPage from '@/navigations/orders/OrderDetailsPage';

export default async function OrderDetailsRoute({ params }) {
  const { id } = await params;
  return <OrderDetailsPage orderId={id} />;
}
