"use client";

import axios from "axios";
import Image from "next/image";
import React, { useState } from "react";
import toast from "react-hot-toast";

function AddBannerModel({ fetchAllBannersDetails, onClose }) {
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    setThumbnailFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setThumbnailPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const loaderId = toast.loading("Adding Banner...");

    if (!title || !thumbnailFile) {
      toast.error("Title and image are required");
      toast.dismiss(loaderId);
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("thumbnailImage", thumbnailFile);

    // debugging purpose
    console.log("Form data being sent:", { title, thumbnailFile });

    try {
      const response = await axios.post("/api/admin/banners", formData);

      if (response.status === 201) {
        toast.success("Banner added successfully", {
          duration: 800,
          id: loaderId,
        });

        // Reset form
        setTitle("");
        setThumbnailFile(null);
        setThumbnailPreview(null);

        setTimeout(() => {
          onClose();
          fetchAllBannersDetails();
        }, 1000);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong", { id: loaderId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-gray-600 dark:text-gray-300"
          onClick={onClose}
        >
          ✕
        </button>
        {/* Add Banner form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 text-sm"
        >
          <h3 className="text-xl font-semibold text-indigo-700 dark:text-indigo-400">Add Banner</h3>

          <div>
            <label className="text-indigo-600 dark:text-indigo-400">Title</label>
            <input
              type="text"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="text-indigo-600 dark:text-indigo-400">Thumbnail Image</label>
            <input
              type="file"
              name="thumbnailImage"
              accept="image/*"
              required
              className="w-full mt-1 p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              onChange={handleThumbnailChange}
            />
            {thumbnailPreview && (
              <div className="mt-2">
                <Image
                  width={300}
                  height={300}
                  src={thumbnailPreview}
                  alt="Preview"
                  className="w-32 h-32 object-contain rounded"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-700 hover:bg-indigo-800 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddBannerModel;
