import ProductDetailsPage from '@/pages/product-details-page/ProductDetailsPage';


export default function ProductDetailsRoute({ params }) {
  const { id } = params;

  return (
        <ProductDetailsPage id={id} />
  );
}
