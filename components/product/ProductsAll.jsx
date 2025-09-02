import React from "react";
import ProductCard from "../product-card/ProductCard";
import ProductSlider from "./ProductSlider";
import Link from "next/link";

function ProductsAll() {
  // Top Trending Products section
  return (
    <>
      {/* trending product header */}
      <div className="flex justify-center py-12 max-sm:py-4 flex-col items-center space-y-1.5 max-sm:px-3 ">
        <h2 className="text-3xl font-semibold text-amber-600 dark:text-amber-400">
          Top Trending Products
        </h2>
        <p className="text-xl text-center text-gray-700 dark:text-gray-300">
          Discover the most popular products customers are loving right now
        </p>
      </div>
      
      {/* product slider components start here */}
      <ProductSlider />
      {/* product slider components end here */}

      <div className="flex justify-center py-4 ">
        <Link
          href={"/products"}
          className="btn bg-amber-500 hover:bg-amber-600 text-xl text-white rounded"
        >
          View More
        </Link>
      </div>
    </>
  );
}

export default ProductsAll;
