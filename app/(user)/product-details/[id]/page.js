import ProductDetailsPage from '@/app/navigations/product-details-page/ProductDetailsPage';

export default async function ProductDetailsRoute({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return <ProductDetailsPage id={id} />;
}
