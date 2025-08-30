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
    description: "",
    category: "",
    maxPrice: "",
    discount: "",
    price: "",
    overview: "",
    keyFeatures: "",
    gst: "",
    shipping: "",
    mlmPrice: "",
    productType: "REGULAR",
    thumbnailImage: null,
    productImages: [],
  };

  const [formData, setFormData] = useState(formInitilizer);

  // For preview
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [multipleImages, setMultipleImages] = useState([]);

  const [categories, setCategories] = useState([]);

  const router = useRouter();

  const fetchAllCategoryDetails = async () => {
    try {
      const response = await axios.get("/api/admin/manage-category?limit=1000&skip=0");
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

    if (name === "maxPrice" || name === "discount") {
      const updatedData = { ...formData, [name]: value };
      const { maxPrice, discount } = updatedData;

      if (maxPrice && discount) {
        updatedData.price = (maxPrice - (maxPrice * discount) / 100).toFixed(2);
      }

      setFormData(updatedData);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, thumbnailImage: file }));

    if (file) {
      const preview = URL.createObjectURL(file);
      setThumbnailPreview(preview);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Form data before submission:", formData);

    // Basic validation
    if (!formData.title || !formData.description || !formData.category) {
      toast.error("Please fill in all required fields: Title, Description, and Category");
      return;
    }

    if (!formData.maxPrice || formData.maxPrice <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const form = new FormData();
    form.append("title", formData.title);
    form.append("description", formData.description);
    form.append("category", formData.category);
    form.append("maxPrice", formData.maxPrice);
    form.append("discount", formData.discount || "0");
    form.append("price", formData.price || formData.maxPrice);
    form.append("overview", formData.overview || "");
    form.append("keyFeatures", formData.keyFeatures || "");
    form.append("gst", formData.gst || "0");
    form.append("shipping", formData.shipping || "0");
    form.append("mlmPrice", formData.mlmPrice || "0");
    form.append("productType", formData.productType || "REGULAR");

    // Append thumbnail image
    if (formData.thumbnailImage) {
      form.append("thumbnailImage", formData.thumbnailImage);
    }

    // Append multiple images
    multipleImages.forEach((file) => {
      form.append("productImages", file);
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
    <section className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-start">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2 cursor-pointer "
        >
          <FaArrowLeft /> Back
        </button>
        <h2 className="text-2xl font-semibold text-green-800 mb-6">
          Add Product
        </h2>
      </div>

      <p className="p-2 text-sm text-gray-600">
        Use Webp Optimized images standard size
      </p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Product Name */}
          <div className="col-span-2">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Product Name
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400"
            />
          </div>

          {/* Product Description */}
          <div className="col-span-2">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400"
            ></textarea>
          </div>

          {/* Category and Price */}
          <div className="col-span-2 grid grid-cols-2 gap-x-2">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full pl-2 py-2 text-sm rounded-md border border-gray-300"
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
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Price
              </label>
              <input
                type="number"
                name="maxPrice"
                value={formData.maxPrice}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400"
              />
            </div>
          </div>

          {/* Discount and Final Price */}
          <div className="col-span-2 grid grid-cols-2 gap-x-2">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Discount (%)
              </label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Final Price
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                readOnly
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
          </div>

          {/* GST, Shipping, and MLM Price */}
          <div className="col-span-2 grid grid-cols-3 gap-x-2">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
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
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                MLM Price (₹)
              </label>
              <input
                type="number"
                name="mlmPrice"
                value={formData.mlmPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400"
              />
            </div>
          </div>

          {/* Product Type */}
          <div className="col-span-2">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Product Type
            </label>
            <select
              name="productType"
              value={formData.productType}
              onChange={handleInputChange}
              className="w-full pl-2 py-2 text-sm rounded-md border border-gray-300"
            >
              <option value="REGULAR">Regular Product</option>
              <option value="TRENDING">Trending Product</option>
              <option value="MLM">MLM Product</option>
            </select>
            {formData.productType === "MLM" && (
              <p className="text-xs text-blue-600 mt-1">
                💡 MLM products require MLM Price to be set for commission calculations
              </p>
            )}
          </div>

          {/* Overview and Key Features */}
          <div className="col-span-2">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Overview
            </label>
            <textarea
              name="overview"
              value={formData.overview}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400"
            ></textarea>
          </div>

          <div className="col-span-2">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Key Features (,,)
            </label>
            <textarea
              name="keyFeatures"
              value={formData.keyFeatures}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-400"
            ></textarea>
          </div>

          {/* Thumbnail Image Upload */}
          <div className="col-span-2">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Thumbnail Image
            </label>
            <input
              type="file"
              accept="image/*"
              name="thumbnailImage"
              onChange={handleThumbnailChange}
              className="w-full text-sm border border-gray-300 rounded-md py-2 px-3"
            />
            {thumbnailPreview && (
              <div className="mt-2">
                <Image
                  width={200}
                  height={200}
                  src={thumbnailPreview}
                  alt="Thumbnail Preview"
                  className=" w-24 object-contain rounded-md"
                />
              </div>
            )}
          </div>

          {/* Multiple Images Upload */}
          <div className="col-span-2">
            <div>
              <ImagesUploader
                label={"productImages"}
                maxFiles={5}
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
