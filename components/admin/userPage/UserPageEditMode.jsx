"use client";

import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

function UserPageEditMode() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const formDataInitilize = {
    name: "",
    gender: "",
    email: "",
    contactNo: "",
  };
  const [formData, setFormData] = useState(formDataInitilize);

  const fetchUserDetailsById = async () => {
    try {
      const response = await axios.get(`/api/admin/users/${id}`);
      const user = response.data.data;
      const { fullName, email, mobileNo, gender } = user;
      setFormData((prev) => ({
        ...prev,
        name: fullName,
        email: email,
        contactNo: mobileNo,
        gender: gender || "",
      }));
    } catch (error) {
      console.log("Internal Server Error While Fetching User Details", error);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.contactNo.length != 10) {
      return toast.error("Contact Number Must be 10 Digit ");
    }

    console.log("Updated User:", formData);
    const userPayload = {
      fullName: formData.name,
      mobileNo: formData.contactNo,
      email: formData.email,
      gender: formData.gender,
    };
    try {
      const response = await axios.put(`/api/admin/users/${id}`, userPayload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        toast.success("User Updated", { duration: 1000 });
        setTimeout(() => {
          router.back();
        });
      }
    } catch (error) {}
  };

  useEffect(() => {
    fetchUserDetailsById();
  }, [id]);

  return (
    <div className="bg-white w-full">
      <div className="flex justify-between mb-4">
        <button
          onClick={() => history.back()}
          className="btn btn-success rounded text-white"
        >
          Go Back
        </button>
        <h2 className="text-2xl font-semibold text-blue-800 mb-6">
          Update User
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <input type="hidden" name="userId" value={formData.userId} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Name */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Gender
            </label>
            <select
              name="gender"
              required
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option disabled value="">
                Select
              </option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Contact No */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Contact No
            </label>
            <input
              type="text"
              name="contactNo"
              required
              value={formData.contactNo}
              onChange={handleChange}
              className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="submit"
            className="px-3 btn py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Update
          </button>
        </div>
      </form>
      
    </div>
  );
}

export default UserPageEditMode;
