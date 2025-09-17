"use client";

import React, { useEffect, useState } from "react";
import { FaPhoneAlt } from "react-icons/fa"; // Make sure to install react-icons if not done
import PasswordUpdateSetting from "./PasswordUpdateSetting";
import axios from "axios";
import { useSession } from "next-auth/react";
import LoaderEffect from "@/components/ui/LoaderEffect";
import toast from "react-hot-toast";

const AddressUpadte = () => {
  const { data } = useSession();
  const userId = data?.user?.id;

  // State for form inputs
  const [formData, setFormData] = useState({
    houseNo: "",
    area: "",
    landmark: "",
    villageCity: "",
    taluka: "",
    district: "",
    pinCode: "",
    state: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle change in form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // fetch user address details

  const fetchUserAddressDetails = async () => {
    try {
      const response = await axios.get(
        `/api/account/settings/address/${userId}`
      );

      const address = response.data.address;
      setFormData((prev) => ({
        ...prev,
        landmark: address.landmark || "",
        state: address.state || "",
        houseNo: address.houseNumber || "",
        area: address.area || "",
        district: address.district || "",
        pinCode: address.pinCode || "",
        taluka: address.taluka || "",
        villageCity: address.villageOrCity || "",
      }));
    } catch (error) {
      console.log(
        "Internal Server Error While Fetching the user address",
        error
      );
    }
  };

  // Handle form submission (Just for demo, doesn't do anything)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const payload = {
        ...formData,
        userId: userId,
      };

      const response = await axios.put(
        "/api/account/settings/address",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if(response.status === 201 || response.status === 200){
        toast.success("Address Updated")
        return
      }

      toast.success(`${response.data.response}`)

    } catch (error) {
      console.log("Internal Sever Error While Updating the Address", error);
      toast.error("Internal Sever Error While Updating the Address")
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchUserAddressDetails();
  }, [userId]);

  if (formData.fullName?.length <= 1) {
    return <LoaderEffect />;
  }

  return (
    <>
      <div className="settings-section aos-init aos-animate" data-aos="fade-up">
        <form
          method="POST"
          onSubmit={handleSubmit}
          className="settings-form space-y-6"
        >
          <input type="hidden" name="action" value="update-profile" />

          {/* Delivery Address Section */}
          <h3 className="text-xl font-semibold mt-8 mb-4">Delivery Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* House No. / Flat No. */}
            <div className="col-span-1">
              <label
                htmlFor="houseNo"
                className="form-label block text-sm font-medium text-gray-700"
              >
                House No. / Flat No.
              </label>
              <input
                placeholder="House No. / Flat No."
                className="input input-bordered w-full my-1"
                required
                type="text"
                value={formData.houseNo}
                name="houseNo"
                onChange={handleChange}
              />
            </div>

            {/* Area / Street / Locality */}
            <div className="col-span-1">
              <label
                htmlFor="area"
                className="form-label block text-sm font-medium text-gray-700"
              >
                Area / Street / Locality
              </label>
              <input
                placeholder="Area / Street / Locality"
                className="input input-bordered w-full my-1"
                required
                type="text"
                value={formData.area}
                name="area"
                onChange={handleChange}
              />
            </div>

            {/* Landmark */}
            <div className="col-span-1">
              <label
                htmlFor="landmark"
                className="form-label block text-sm font-medium text-gray-700"
              >
                Landmark (Optional)
              </label>
              <input
                placeholder="Landmark (optional)"
                className="input input-bordered w-full my-1"
                type="text"
                value={formData.landmark}
                name="landmark"
                onChange={handleChange}
              />
            </div>

            {/* Village / City */}
            <div className="col-span-1">
              <label
                htmlFor="villageCity"
                className="form-label block text-sm font-medium text-gray-700"
              >
                Village / City
              </label>
              <input
                placeholder="Village / City"
                className="input input-bordered w-full my-1"
                required
                type="text"
                value={formData.villageCity}
                name="villageCity"
                onChange={handleChange}
              />
            </div>

            {/* Taluka / Tehsil */}
            <div className="col-span-1">
              <label
                htmlFor="taluka"
                className="form-label block text-sm font-medium text-gray-700"
              >
                Taluka / Tehsil
              </label>
              <input
                placeholder="Taluka / Tehsil"
                className="input input-bordered w-full my-1"
                required
                type="text"
                value={formData.taluka}
                name="taluka"
                onChange={handleChange}
              />
            </div>

            {/* District */}
            <div className="col-span-1">
              <label
                htmlFor="district"
                className="form-label block text-sm font-medium text-gray-700"
              >
                District
              </label>
              <input
                placeholder="District"
                className="input input-bordered w-full my-1"
                required
                type="text"
                value={formData.district}
                name="district"
                onChange={handleChange}
              />
            </div>

            {/* PIN-CODE */}
            <div className="col-span-1">
              <label
                htmlFor="district"
                className="form-label block text-sm font-medium text-gray-700"
              >
                Pin-Code
              </label>
              <input
                placeholder="Pin-Code"
                className="input input-bordered w-full my-1"
                required
                type="number"
                value={formData.pinCode}
                name="pinCode"
                onChange={handleChange}
              />
            </div>

            {/* State */}
            <div className="col-span-1">
              <label
                htmlFor="state"
                className="form-label block text-sm font-medium text-gray-700"
              >
                State
              </label>
              <select
                name="state"
                className="select select-bordered w-full my-1"
                required
                value={formData.state}
                onChange={handleChange}
              >
                <option value="">-- Select State --</option>
                {[
                  "Andhra Pradesh",
                  "Arunachal Pradesh",
                  "Assam",
                  "Bihar",
                  "Chhattisgarh",
                  "Goa",
                  "Gujarat",
                  "Haryana",
                  "Himachal Pradesh",
                  "Jharkhand",
                  "Karnataka",
                  "Kerala",
                  "Madhya Pradesh",
                  "Maharashtra",
                  "Manipur",
                  "Meghalaya",
                  "Mizoram",
                  "Nagaland",
                  "Odisha",
                  "Punjab",
                  "Rajasthan",
                  "Sikkim",
                  "Tamil Nadu",
                  "Telangana",
                  "Tripura",
                  "Uttar Pradesh",
                  "Uttarakhand",
                  "West Bengal",
                  "Andaman and Nicobar Islands",
                  "Chandigarh",
                  "Dadra and Nagar Haveli and Daman and Diu",
                  "Delhi",
                  "Jammu and Kashmir",
                  "Ladakh",
                  "Lakshadweep",
                  "Puducherry",
                ].map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Buttons */}
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={isUpdating}
              className="btn-save bg-blue-600 text-white py-2 px-6 rounded-md shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin border-2 border-current border-t-transparent rounded-full w-4 h-4"></div>
                  Updating Address...
                </>
              ) : (
                'Save Address Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddressUpadte;
