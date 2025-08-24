"use client";

import ProductDetailsImageComponent from "@/components/product/ProductDetailsImageComponent";
import { FaCheckCircle } from "react-icons/fa";
import { IoBag } from "react-icons/io5";

import React, { useEffect, useState } from "react";
import axios from "axios";
import LoaderEffect from "@/components/ui/LoaderEffect";
import toast from "react-hot-toast";

function ProductDetailsPage({ id }) {
  // THIS ID PROPS COMMING FROM PRODUCTCARDV2 COMPONENTS TO FETCH THE PARTICULAR PRODUCT DETAILS

  const [productDetails, setProductDetails] = useState(null);

  // FETCHING ALL PRODUCTS DETAILS
  const fetchProductDetails = async (id) => {
    try {
      const response = await axios.get(`/api/product-details/${id}`);
      setProductDetails(response.data.product);
    } catch (error) {
      console.log("Internal Error While fetching the product details", error);
      toast.error("Internal Error While fetching the product details");
    }
  };

  // USER FOR API WITH DEPENCENY OF PRODUCT ID
  useEffect(() => {
    fetchProductDetails(id);
  }, [id]);

  if (productDetails === null) {
    return <LoaderEffect />;
  }

  const {
    category,
    description,
    longDescription,
    mainImage,
    price,
    discount,
    sellingPrice,
    title,
    inStock,
    keyFeature,
  } = productDetails;

  return (
    <div className="max-w-screen-2xl mx-auto px-8max-sm:px-4">
      {/* page title */}
      <div className="bg-slate-200 flex justify-between px-16 max-sm:px-2 py-6 mx-auto">
        <div>
          <h2 className="text-amber-400 text-2xl font-semibold">
            Product Details
          </h2>
        </div>
        <div>
          <span>Home / Product Details</span>
        </div>
      </div>
      <div
        id="product-details"
        className="flex gap-16 my-16 px-8 max-sm:my-4 max-sm:flex-wrap max-sm:px-4 "
      >
        <div className=" max-h-[800px] max-w-5/12 max-sm:max-w-full ">
          {/* THIS PRODUCT DETAILS COMPONENT USED FOR SLIDER IF PRODUTSDETAILS HAVE IMAGES ARRAY LENGTH >1 */}
          <ProductDetailsImageComponent productDetails={productDetails} />

        </div>

        <div className="mt-4">
          <div id="product-head" className="space-y-5">
            <span className="text-2xl text-slate-500 uppercase font-medium">
              {category?.name}
            </span>
            <h2 className="text-3xl font-semibold text-amber-400">{title}</h2>
            <div className="flex gap-2.5 items-center">
              <span className="text-2xl font-semibold text-amber-400">
                ₹{sellingPrice?.toLocaleString("en-IN")}
              </span>
              <span className="text-slate-800 text-xl line-through">
                ₹{price?.toLocaleString("en-IN")}
              </span>
              <span className="bg-red-600 p-2 rounded text-sm font-medium text-white">
                {discount}%
              </span>
            </div>
          </div>
          <div id="product-body" className="my-4 text-xl text-slate-700">
            <p>{longDescription}</p>
            <div className="flex items-center text-[16px] gap-4 text-slate-700  my-8">
              <span>
                <i className="text-green-600">
                  <FaCheckCircle />
                </i>
              </span>
              <span className="font-medium">In Stock</span>
              <span>({inStock} items left)</span>
            </div>
            <div>
              <button className="btn btn-success text-white font-medium rounded">
                <span>
                  <i>
                    <IoBag />
                  </i>
                </span>
                <span>Buy Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* product detail bottom */}
      <div className="my-16 max-sm:my-4 px-8 max-sm:px-4">
        {/* Tabs Header */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button className="whitespace-nowrap py-4 px-1 border-b-2 border-slate-900 text-slate-900 font-medium text-2xl">
              Description
            </button>
            {/* Future tabs can be added here */}
            {/* <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">Reviews</button> */}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6 text-gray-700 space-y-4">
          <div>
            <h4 className=" font-semibold text-amber-400 text-2xl">
              Product Overview
            </h4>
            <p>{description}</p>
          </div>

          <div>
            <h4 className=" font-semibold text-amber-400 text-2xl">
              Key Features
            </h4>
            <ul className="list-disc pl-6">
              {keyFeature ? (
                <li> {keyFeature} </li>
              ) : (
                <li>Key Feture Not Found</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailsPage;
