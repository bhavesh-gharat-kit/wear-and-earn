"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { uploadToCloudinary } from "@/lib/upload-to-cloudinary";

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

// When cloudUpload=true, this component uploads files to Cloudinary immediately and stores URLs
const ImagesUploaderComponent = ({ label, maxFiles, images, setImages, cloudUpload = true }) => {
  
  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length + images.length > maxFiles) {
      toast.error(`Only ${maxFiles} images allowed.`);
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (!allowedImageTypes.includes(file.type)) {
        toast.error("Only JPEG, PNG, WEBP, JPG files allowed!");
        return;
      }
      if (file.size > 1 * 1024 * 1024) {
        toast.error(`Each file must be less than 1MB: ${file.name}`);
        return;
      }
      validFiles.push(file);
    }

    if (cloudUpload) {
      // Upload sequentially to show clear toasts; could be batched if needed
      (async () => {
        for (const file of validFiles) {
          try {
            const res = await uploadToCloudinary(file);
            // Keep only the secure_url to store in DB
            setImages((prev) => [...prev, res.secure_url].slice(0, maxFiles));
            toast.success(`${file.name} uploaded`);
          } catch (e) {
            console.error(e);
            toast.error(`Upload failed: ${file.name}`);
          }
        }
      })();
    } else {
      setImages((prev) => [...prev, ...validFiles].slice(0, maxFiles));
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="mb-4">
      <label className="block font-medium text-gray-700">{label}</label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        className="w-full border rounded-lg p-2"
      />
      <div className="flex flex-wrap gap-2 mt-2">
        {images?.map((file, index) => (
          <div key={index} className="relative">
            {typeof file === 'string' ? (
              <Image
                height={256}
                width={256}
                src={file}
                alt="Preview"
                className="w-24 h-24 rounded-lg border object-cover"
              />
            ) : (
              <Image
                height={256}
                width={256}
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="w-24 h-24 rounded-lg border object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-full"
            >
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImagesUploaderComponent;
