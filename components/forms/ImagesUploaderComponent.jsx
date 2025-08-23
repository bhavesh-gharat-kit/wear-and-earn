"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

const ImagesUploaderComponent = ({ label, maxFiles, images, setImages }) => {
  
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

    setImages((prev) => [...prev, ...validFiles].slice(0, maxFiles));
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
            <Image
              height={256}
              width={256}
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="w-24 h-24 rounded-lg border"
            />
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
