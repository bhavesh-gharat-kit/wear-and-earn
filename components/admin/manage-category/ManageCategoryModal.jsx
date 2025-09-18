import axios from "axios";
import React, { useEffect, useState } from "react";
import { BiSave } from "react-icons/bi";
import { IoMdClose } from "react-icons/io";
import toast from "react-hot-toast";

function ManageCategoryModal({
  defaultValues = { id: "", name: "", description: "" },
  onClose,
  mode = "add",
  fetchAllCategoryDetails,
}) {
  const [formData, setFormData] = useState(defaultValues);

  useEffect(() => {
    setFormData(defaultValues);
  }, [defaultValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    
    const toastId = toast.loading(mode === "add" ? "Adding category..." : "Updating category...");
    
    if (mode === "add") {
      try {
        console.log("Sending POST request with data:", formData);
        const response = await axios.post(
          "/api/admin/manage-category",
          formData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Response received:", response);
        
        if (response.status === 201) {
          toast.success("Category added successfully", { id: toastId });
          onClose();
          fetchAllCategoryDetails();
        }
      } catch (error) {
        console.error("Error adding category:", error);
        console.error("Response data:", error.response?.data);
        toast.error(error.response?.data?.message || "Failed to add category", { id: toastId });
      }
    } else {
      try {
        console.log("Sending PUT request with data:", formData);
        const response = await axios.put(
          `/api/admin/manage-category/${defaultValues.id}`,
          formData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Response received:", response);
        
        if (response.status === 200) {
          toast.success("Category updated successfully", { id: toastId });
          onClose();
          fetchAllCategoryDetails();
        }
      } catch (error) {
        console.error("Error updating category:", error);
        console.error("Response data:", error.response?.data);
        toast.error(error.response?.data?.message || "Failed to update category", { id: toastId });
      }
    }
  };

  return (
    <dialog id="category_modal" className="modal modal-open">
      <div className="modal-box max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-blue-700">
            {mode === "edit" ? "Edit Category" : "Add Category"}
          </h3>
          <button
            onClick={onClose}
            id="close-btn"
            className="btn btn-sm btn-circle btn-ghost text-gray-600 hover:text-black"
          >
            <IoMdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4 text-sm">
          {/* Hidden ID */}
          <input type="hidden" name="id" value={formData.id} />

          {/* Name Field */}
          <div>
            <label htmlFor="catName" className="text-gray-700">
              Name
            </label>
            <input
              type="text"
              name="name"
              id="catName"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="catDescription" className="text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              id="catDescription"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            ></textarea>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded"
            >
              <BiSave size={18} />
              {mode === "edit" ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

export default ManageCategoryModal;
