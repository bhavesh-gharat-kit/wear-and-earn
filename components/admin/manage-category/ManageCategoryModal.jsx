import axios from "axios";
import React, { useEffect, useState } from "react";
import { BiSave } from "react-icons/bi";
import { IoMdClose } from "react-icons/io";

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
    if (mode === "add") {
      try {
        const response = await axios.post(
          "/api/admin/manage-category",
          formData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 201) {
          const closeBtn = document.querySelector("#close-btn");
          closeBtn.click();
          fetchAllCategoryDetails();
        }
      } catch (error) {
        console.log("Internal Serevr Error", error);
      }
    } else {
      try {
        const response = await axios.put(
          `/api/admin/manage-category/${defaultValues.id}`,
          formData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 200) {
          const closeBtn = document.querySelector("#close-btn");
          closeBtn.click();
          fetchAllCategoryDetails();
        }
      } catch (error) {
        console.log("Internal Serevr Error", error);
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
