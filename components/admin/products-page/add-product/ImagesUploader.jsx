"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import LoaderEffect from "@/components/ui/LoaderEffect";

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

const ImagesUploader = ({ label, maxFiles, images, setImages }) => {

  // Cleanup effect to revoke object URLs and prevent memory leaks
  useEffect(() => {
    return () => {
      if (images && Array.isArray(images)) {
        images.forEach(image => {
          if (image?.file instanceof File) {
            // Find any blob URLs that might have been created for this file
            const blobUrls = document.querySelectorAll('img[src^="blob:"]');
            blobUrls.forEach(img => {
              URL.revokeObjectURL(img.src);
            });
          }
        });
      }
    };
  }, [images]);

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
    validFiles.push({
  file,
  color: ""
});

    }

    setImages((prev) => [...prev, ...validFiles].slice(0, maxFiles));
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };


  return (
    <div className="mb-4">
      <label className="block font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
      />
      <div className="flex flex-wrap gap-2 mt-2">
        {images?.map((image, index) => {
          // Safe URL creation function
         const getSafeImageUrl = (imageObj) => {
  if (imageObj?.imageUrl) {
    return imageObj.imageUrl;
  }
  if (imageObj?.file instanceof File) {
    return URL.createObjectURL(imageObj.file);
  }
  return null;
};

      

const imageUrl = getSafeImageUrl(image)

          
          return (
            <div key={index} className="relative">
              {imageUrl && (
                <Image
                  height={256}
                  width={256}
                  src={imageUrl}
                  alt="Preview"
                  className="w-28 h-28 rounded-lg border object-cover"
                />
                
              )}
              <input
  type="text"
  placeholder="Color (e.g. Red)"
  value={image.color}
  onChange={(e) => {
    const updatedImages = [...images];
    updatedImages[index].color = e.target.value;
    setImages(updatedImages);
  }}
  className="mt-1 w-full text-sm border rounded px-2 py-1"
/>

              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-full"
              >
                X
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImagesUploader;
