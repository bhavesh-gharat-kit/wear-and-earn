"use client";

import axios from "axios";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import ImagesUploader from "../add-product/ImagesUploader";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import LoaderEffect from "@/components/ui/LoaderEffect";
import Image from "next/image";

const AdminEditProduct = ({ params }) => {
  const router = useRouter();
  
  // Get the id from params (for server components) or useParams (for client components)
  const id = params?.id || useParams()?.id;

  const formInitilizer = {
    title: "",
    description: "",
    category: "",
    maxPrice: "",
    discount: "",
    price: "",
    overview: "",
    keyFeatures: "",
    thumbnailImage: null,
    productImages: [],
  };

  const [formData, setFormData] = useState(formInitilizer);

  // For preview
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [multipleImages, setMultipleImages] = useState([]);

  const [categories, setCategories] = useState([]);
  const [productDetails, setProductDetails] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllCategoryDetails = async () => {
    try {
      const response = await axios.get("/api/admin/manage-category?limit=1000&skip=0");
      setCategories(response.data.response);
    } catch (error) {
      console.log("Internal Server Error", error);
      toast.error("Failed to fetch categories");
    }
  };

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/admin/products/${id}`);
      const productDet = response.data.product;
      setProductDetails(productDet);
    } catch (error) {
      console.log("Internal Server Error", error);
      setError("Failed to fetch product details. Please try again.");
      toast.error("Failed to fetch product details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAllCategoryDetails();
      fetchProductDetails();
    } else {
      setError("No product ID provided");
      setLoading(false);
    }
  }, [id]);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

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

    if (file && file instanceof File) {
      try {
        const preview = URL.createObjectURL(file);
        setThumbnailPreview(preview);
      } catch (error) {
        console.error("Error creating object URL:", error);
        toast.error("Error processing image file");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData();

    form.append("title", formData.title);
    form.append("description", formData.description);
    form.append("category", formData.category);
    form.append("maxPrice", formData.maxPrice);
    form.append("discount", formData.discount);
    form.append("price", formData.price);
    form.append("overview", formData.overview);
    form.append("keyFeatures", formData.keyFeatures);

    // Append thumbnail if present
    if (formData.thumbnailImage) {
      form.append("thumbnailImage", formData.thumbnailImage);
    }

    // Detect if any productImages are new files or strings
    const hasAnyProductImages = multipleImages && multipleImages.length > 0;
    const shouldSendProductImages =
      hasAnyProductImages &&
      multipleImages.some(
        (img) => img instanceof File || img.imageUrl || typeof img === "string"
      );

    if (shouldSendProductImages) {
      multipleImages.forEach((img) => {
        if (img instanceof File) {
          form.append("productImages", img);
        } else if (typeof img === "string") {
          form.append("productImages", img);
        } else if (typeof img === "object" && img.imageUrl) {
          form.append(
            "productImages",
            JSON.stringify({ imageUrl: img.imageUrl })
          );
        }
      });
    }

    const toastId = toast.loading("Updating product...");

    try {
      const response = await axios.put(`/api/admin/products/${id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        toast.success("Product updated successfully", {
          id: toastId,
          duration: 800,
        });
        setTimeout(() => {
          setFormData(formInitilizer);
          setMultipleImages([]);
          setThumbnailPreview(null);
          router.push("/admin/products");
        }, 1000);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product", { id: toastId });
    }
  };

  useEffect(() => {
    if (!productDetails || typeof productDetails !== "object") return;

    const {
      title,
      description,
      longDescription,
      price,
      sellingPrice,
      discount,
      keyFeature,
      category,
      mainImage,
      images,
    } = productDetails;

    setFormData((prev) => ({
      ...prev,
      title,
      description,
      overview: longDescription,
      discount,
      keyFeatures: keyFeature || "",
      price: sellingPrice,
      maxPrice: price,
      category: category?.name,
    }));
    setThumbnailPreview(mainImage);
    setMultipleImages((prev) =>
      images.length <= 0
        ? [{ imageUrl: productDetails.mainImage }]
        : [...images]
    );
  }, [productDetails]);

  if (loading) {
    return <LoaderEffect />;
  }

  if (error) {
    return (
      <section className="p-4 sm:p-8 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">Error Loading Product</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => {
                  setError(null);
                  fetchProductDetails();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Try Again
              </button>
              <Link
                href="/admin/products"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
              >
                Back to Products
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  if (!productDetails) {
    return <LoaderEffect />;
  }

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
          Edit Product
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
                  <option key={cat.id} value={cat.name}>
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
                  width={300}
                  height={300}
                  src={thumbnailPreview}
                  alt="Thumbnail Preview"
                  className="w-24 object-contain rounded-md"
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
            className="px-4 py-2 cursor-pointer btn bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Save Product
          </button>
        </div>
      </form>
      
    </section>
  );
};

export default AdminEditProduct;
