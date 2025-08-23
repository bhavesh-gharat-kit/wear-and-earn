"use client";

import axios from "axios";
import Link from "next/link";
import { IoArrowBackSharp } from "react-icons/io5";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";

function EditBanner() {
  const [bannerDetails, setBannerDetails] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    setThumbnailFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const fetchBannerDetails = async () => {
    try {
      const response = await axios.get(`/api/admin/banners/${id}`);
      const bannerDet = response.data.data;
      setBannerDetails(bannerDet);
      setTitle(bannerDet?.title || "");
      setThumbnailPreview(bannerDet?.imageUrl || null);
    } catch (error) {
      console.error("Error fetching banner:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);

    // only append image if new file is selected
    if (thumbnailFile) {
      formData.append("thumbnailImage", thumbnailFile);
    }

    try {
      const response = await axios.put(`/api/admin/banners/${id}`, formData);
      if (response.status == 200) {
        toast.success("Banner Updated", { duration: 1000 });
        setTimeout(() => {
          router.push("/admin/banners");
        }, 1200);
      }
    } catch (error) {
      console.error("Error updating banner:", error);
      toast.error("Error updating banner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBannerDetails();
  }, []);

  return (
    <>
      <div>
        <Link className="btn btn-primary" href={"/admin/banners"}>
          <IoArrowBackSharp /> Back
        </Link>
      </div>

      <div className="w-full flex justify-center">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg p-6 w-full max-w-lg space-y-4 text-sm"
        >
          <h3 className="text-xl font-semibold text-indigo-700">Edit Banner</h3>

          <div>
            <label className="text-indigo-600">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
            />
          </div>

          <div>
            <label className="text-indigo-600">Thumbnail Image</label>
            <input
              type="file"
              accept="image/*"
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
                  className="w-52 object-contain rounded"
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
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default EditBanner;
