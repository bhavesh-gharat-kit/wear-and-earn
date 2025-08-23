"use client";

import React, { useEffect, useState } from "react";
import { FaPhoneAlt } from "react-icons/fa"; // Make sure to install react-icons if not done
import PasswordUpdateSetting from "./PasswordUpdateSetting";
import axios from "axios";
import { useSession } from "next-auth/react";
import LoaderEffect from "@/components/ui/LoaderEffect";
import AddressUpadte from "./AddressUpadte";
import toast from "react-hot-toast";

const AccountSettings = () => {
  const { data } = useSession();
  const userId = data?.user?.id;

  // State for form inputs
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    gender: "",
  });

  // Handle change in form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission (Just for demo, doesn't do anything)
  const handleSubmit = async (e) => {
    if (formData.contactNumber.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits");
      return;
    }
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        id: userId,
      };

      const response = await axios.put("/api/account/settings/profile", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if(response.status === 200){
        toast.success("Profile Updated Successfully")
        return
      }

    } catch (error) {
      console.log("Internal Server Error While upadting");
      toast.error("Internal Server Error While upadting")
    }
  };

  const fetchLoggedUserDetails = async () => {
    try {
      const response = await axios.get(`/api/account/settings/profile/${userId}`);
      const user = await response.data;
      setFormData((prev) => ({
        ...prev,
        fullName: user?.fullName,
        email: user?.email,
        contactNumber: user?.mobileNo,
        gender : user?.gender
      }));
    } catch (error) {
      console.log("Internal Serevr Error While get usr details", error);
    }
  };

  useEffect(() => {
    fetchLoggedUserDetails();
  }, [userId]);

  if (formData.fullName?.length <= 1) {
    return <LoaderEffect />;
  }

  return (
    <>
      <div className="settings-section aos-init aos-animate" data-aos="fade-up">
        <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
        <form
          method="POST"
          onSubmit={handleSubmit}
          className="settings-form space-y-6"
        >
          <input type="hidden" name="action" value="update-profile" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name Input */}
            <div className="col-span-1">
              <label
                htmlFor="fullName"
                className="form-label block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                type="text"
                className="form-control mt-2 p-3 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email Input */}
            <div className="col-span-1">
              <label
                htmlFor="email"
                className="form-label block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                className="form-control mt-2 p-3 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled
                title="Email is non-editable!"
              />
            </div>

            {/* Phone Input */}
            <div className="col-span-1">
              <label
                htmlFor="phone"
                className="form-label block text-sm font-medium text-gray-700"
              >
                Phone
              </label>
              <div className="flex items-center mt-2">
                <FaPhoneAlt className="mr-2 text-gray-500" />
                <input
                  type="tel"
                  className="form-control p-3 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  id="phone"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Gender Input */}
            <div className="col-span-1">
              <label
                htmlFor="gender"
                className="form-label block text-sm font-medium text-gray-700"
              >
                Gender
              </label>
              <select
                className="form-control mt-2 p-3 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="" disabled>
                  Select Gender
                </option>
                <option value="Male">👨 Male</option>
                <option value="Female">👩 Female</option>
                <option value="Other">🧑 Other</option>
              </select>
            </div>
          </div>

          {/* Form Buttons */}
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="btn-save bg-blue-600 text-white py-2 px-6 rounded-md shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      <AddressUpadte />

      {/* Password Update Component */}
      <PasswordUpdateSetting />
    </>
  );
};

export default AccountSettings;
