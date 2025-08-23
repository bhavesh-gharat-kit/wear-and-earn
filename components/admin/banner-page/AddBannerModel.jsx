"use client";

import axios from "axios";
import Image from "next/image";
import React, { useState } from "react";
import toast from "react-hot-toast";

function AddBannerModel({ fetchAllBannersDetails }) {
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
          document.getElementById("close-btn").click();
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
    <dialog id="my_modal_3" className="modal">
      <div className="modal-box">
        <form method="dialog">
          <button
            id="close-btn"
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          >
            ✕
          </button>
        </form>

        {/* Add Banner form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg p-6 w-full max-w-lg space-y-4 text-sm"
        >
          <h3 className="text-xl font-semibold text-indigo-700">Add Banner</h3>

          <div>
            <label className="text-indigo-600">Title</label>
            <input
              type="text"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
            />
          </div>

          <div>
            <label className="text-indigo-600">Thumbnail Image</label>
            <input
              type="file"
              name="thumbnailImage"
              accept="image/*"
              required
              className="w-full mt-1 p-2 border rounded"
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
    </dialog>
  );
}

export default AddBannerModel;
