"use client";

import axios from "axios";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import ImagesUploader from "./ImagesUploader";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";

const AdminAddProduct = () => {
  const formInitilizer = {
    title: "",
    sizes: "",
    Color: "",
    description: "",
    category: "",
    productPrice: "",      // Pr - Product Price (NEW SPEC)
    mlmPrice: "",         // Pm - MLM Price (NEW SPEC) - MANDATORY
    discount: "",
    overview: "",
    keyFeatures: "",
    gst: "",
    shipping: "",
    productType: "REGULAR",
    productImages: [],
  };

  const [formData, setFormData] = useState(formInitilizer);

  // For preview
  const [multipleImages, setMultipleImages] = useState([]);

  const [categories, setCategories] = useState([]);

  const router = useRouter();

  const fetchAllCategoryDetails = async () => {
    try {
      const response = await axios.get("/api/admin/manage-category?limit=150&skip=0");
      setCategories(response.data.response);
    } catch (error) {
      console.log("Internal Server Error", error);
      toast.error("Failed to fetch categories");
    }
  };

  useEffect(() => {
    fetchAllCategoryDetails();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Auto-calculate total price when any price component changes
    if (["productPrice", "mlmPrice", "gst", "shipping", "discount"].includes(name)) {
      const updatedData = { ...formData, [name]: value };
      const { productPrice, mlmPrice, gst, shipping, discount } = updatedData;

      // Calculate total price = (Pr + Pm + Shipping) + GST - Discount
      if (productPrice && mlmPrice) {
        const basePrice = Number(productPrice) + Number(mlmPrice);
        const shippingAmount = Number(shipping) || 0;
        const subtotal = basePrice + shippingAmount;
        const gstAmount = (subtotal * (Number(gst) || 0)) / 100;
        const discountAmount = (subtotal * (Number(discount) || 0)) / 100;
        updatedData.totalPrice = Number((subtotal + gstAmount - discountAmount).toFixed(2));
      }

      setFormData(updatedData);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Form data before submission:", formData);

    // NEW SPEC: Validation for mandatory fields
    if (!formData.title || !formData.description || !formData.category) {
      toast.error("Please fill in all required fields: Title, Description, and Category");
      return;
    }

    // NEW SPEC: Both Product Price and MLM Price are mandatory
    if (!formData.productPrice || formData.productPrice <= 0) {
      toast.error("Please enter a valid Product Price (Pr)");
      return;
    }

    if (!formData.mlmPrice || formData.mlmPrice <= 0) {
      toast.error("Please enter a valid MLM Price (Pm) - required for pool system");
      return;
    }

    const form = new FormData();
    form.append("title", formData.title);
    form.append("sizes", formData.sizes);
    form.append("Color", formData.Color);
    form.append("description", formData.description);
    form.append("category", formData.category);

    // NEW SPEC: Append pricing data according to spec
    form.append("productPrice", formData.productPrice);  // Pr
    form.append("mlmPrice", formData.mlmPrice);          // Pm
    form.append("discount", formData.discount || "0");   // Discount percentage

    form.append("overview", formData.overview || "");
    form.append("keyFeatures", formData.keyFeatures || "");
    form.append("gst", formData.gst || "0");
    form.append("shipping", formData.shipping || "0");
    form.append("productType", formData.productType || "REGULAR");

    // Append multiple images
    multipleImages.forEach((img) => {
  form.append("productImages", img.file);     // actual image file
  form.append("imageColors", img.color || ""); // matching color
});


    console.log("FormData entries:");
    for (let [key, value] of form.entries()) {
      console.log(key, value);
    }

    const toastId = toast.loading("Adding Product");

    try {
      console.log("Sending request to API...");
      const response = await axios.post(
        "/api/admin/products/add-product",
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("API Response:", response);

      if (response.status === 200) {
        toast.success("Product Added to Database", {
          id: toastId,
          duration: 1000,
        });
        setTimeout(() => {
          setFormData(formInitilizer);
          router.push("/admin/products");
        }, 1200);
      }
    } catch (error) {
      console.error("Frontend error details:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Internal Error While Adding Product to Database", {
        id: toastId,
      });
    }
  };

  return (
    <section className="p-4 sm:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-start">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2 cursor-pointer "
        >
          <FaArrowLeft /> Back
        </button>
        <h2 className="text-2xl font-semibold text-green-800 dark:text-green-400 mb-6">
          Add Product
        </h2>
      </div>

      <p className="p-2 text-sm text-gray-600 dark:text-gray-400">
        Use Webp Optimized images standard size
      </p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Product Name */}
          <div className="col-span-2">
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Product Name
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Product Description */}
          <div className="col-span-2">
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            ></textarea>
          </div>

          {/* Category and Price */}
          <div className="col-span-2 grid grid-cols-2 gap-x-2">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full pl-2 py-2 text-sm rounded-md border border-gray-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="" disabled>
                  Select Category
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Price (Pr) - ₹ <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="productPrice"
                value={formData.productPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Product base price"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This goes directly to company</p>
            </div>
          </div>

          {/* MLM Price and Total Price */}
          <div className="col-span-2 grid grid-cols-2 gap-x-2">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                MLM Price (Pm) - ₹ <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="mlmPrice"
                value={formData.mlmPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="MLM commission amount"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">25% company, 75% pool distribution</p>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Price (Pr + Pm + GST + Shipping)
              </label>
              <input
                type="text"
                value={formData.totalPrice ? `₹${Number(formData.totalPrice).toFixed(2)}` : 'Auto-calculated'}
                readOnly
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300"
              />
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Full price including all charges</p>
            </div>
          </div>

          {/* Customer Pricing Preview */}
          {formData.productPrice && formData.mlmPrice && (
            <div className="col-span-2 bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Customer Will See:</h4>
              <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <div className="flex justify-between">
                  <span>Product Price:</span>
                  <span>₹{(Number(formData.productPrice) + Number(formData.mlmPrice || 0) + Number(formData.shipping || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST ({formData.gst || 0}%):</span>
                  <span>₹{(((Number(formData.productPrice) + Number(formData.mlmPrice || 0) + Number(formData.shipping || 0)) * (Number(formData.gst) || 0)) / 100).toFixed(2)}</span>
                </div>
                {formData.discount && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount ({formData.discount}%):</span>
                    <span>-₹{(((Number(formData.productPrice) + Number(formData.mlmPrice || 0) + Number(formData.shipping || 0)) * Number(formData.discount)) / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t border-blue-200 dark:border-blue-700 pt-1">
                  <span>Final Amount:</span>
                  <span>₹{Number(formData.totalPrice).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Discount (Optional) */}
          <div className="col-span-2 grid grid-cols-1 gap-x-2">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Discount (%) - Optional
              </label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Optional discount percentage"
              />
            </div>
          </div>

          {/* GST and Shipping */}
          <div className="col-span-2 grid grid-cols-2 gap-x-2">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                GST (%)
              </label>
              <input
                type="number"
                name="gst"
                value={formData.gst}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="18"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Shipping Charges (₹)
              </label>
              <input
                type="number"
                name="shipping"
                value={formData.shipping}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400"
                placeholder="50"
              />
            </div>
          </div>

          {/* Product type and size */}
          <div className="col-span-2 grid grid-cols-2 gap-x-2">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Enter Sizes(M, L, XL)
              </label>
              <input
                type="text"
                name="sizes"
                value={formData.sizes || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter product sizes"
              />
            </div>
           
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Type
              </label>
              <select
                name="productType"
                value={formData.productType}
                onChange={handleInputChange}
                className="w-full pl-2 py-2 text-sm rounded-md border border-gray-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="REGULAR">Regular Product</option>
                <option value="TRENDING">Trending Product</option>
              </select>
            </div>
          </div>

          {/* Overview and Key Features */}
          <div className="col-span-2">
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Overview
            </label>
            <textarea
              name="overview"
              value={formData.overview}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            ></textarea>
          </div>

          <div className="col-span-2">
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Key Features (,,)
            </label>
            <textarea
              name="keyFeatures"
              value={formData.keyFeatures}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            ></textarea>
          </div>

          {/* Multiple Images Upload */}
          <div className="col-span-2">
            <div>
              <ImagesUploader
                label={"productImages"}
                maxFiles={10}
                images={multipleImages}
                setImages={setMultipleImages}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 mt-8">
          <Link
            href={"/admin/products"}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Add Product
          </button>
        </div>
      </form>

    </section>
  );
};

export default AdminAddProduct;
