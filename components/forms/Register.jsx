"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import toast from "react-hot-toast";
import axios from "axios";
//import { useNavigate } from "react-router-dom";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

// Validation schema using Yup
const schema = Yup.object().shape({
  fullName: Yup.string()
    .min(3, "Full Name must be at least 3 characters")
    .required("Full Name is required"),
  // email: Yup.string()
  //   .email("Invalid email address")
  //   .required("Email is required"),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .required("Phone number is required"),
  address: Yup.string()
    .required("Address is required")
    .min(6, "address must be 6 character"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm Password is required"),
  referralCode: Yup.string().optional(),
});

const Register = ({ setIsLogin }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sponsorInfo, setSponsorInfo] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema), // Using the Yup resolver for validation
  });

  const referralCode = watch("referralCode");

  useEffect(() => {
    // Check for referral code in URL - support both 'ref' and 'spid' parameters
    const urlReferralCode = searchParams.get('ref') || searchParams.get('spid');
    if (urlReferralCode) {
      setValue("referralCode", urlReferralCode);
    }
  }, [searchParams, setValue]);

  useEffect(() => {
    // Validate referral code when it changes
    if (referralCode && referralCode.length > 3) {
      validateReferralCode(referralCode);
    } else {
      setSponsorInfo(null);
    }
  }, [referralCode]);

  const validateReferralCode = async (code) => {
    try {
      const response = await axios.get(`/api/validate-referral?code=${code}`);
      if (response.data.success) {
        setSponsorInfo(response.data.sponsor);
      } else {
        setSponsorInfo(null);
      }
    } catch (error) {
      setSponsorInfo(null);
    }
  };

  const onSubmit = async (data) => {
    try {
      // USER DETAILS FOR /SIGNUP ROUTE
      const userPayload = {
        fullName: data.fullName,
        email: data?.email,
        mobileNo: data.phone,
        address: data?.address,
        password: data.confirmPassword,
        referralCode: data.referralCode || null,
      };

      const response = await axios.post("/api/signup", userPayload);
      toast.success("Sign Up Successfully!", { duration: 1200 });
      reset();
      setTimeout(() => {
        setIsLogin(true);
        router.push("/login-register");
      }, 1400);
    } catch (error) {
      console.log("Internal Server Error While Signing", error);
      toast.error(`Error : ${error?.response?.data?.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-3 sm:px-4">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl sm:shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col items-center">
        <Image src={"/images/brand-logo.png"} width={80} height={80} className="sm:w-[100px] sm:h-[100px] mb-4 sm:mb-6 rounded-full border-2 border-amber-500 bg-white dark:bg-gray-800" alt="WearEarn Logo" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-600 dark:text-amber-400 mb-2 sm:mb-3 tracking-tight text-center">Join WearEarn</h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 text-center">Create your account</p>

        {/* Mobile-Enhanced Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
          {/* Responsive Grid Layout for Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6">
            {/* Full Name */}
            <div className="mb-4 sm:mb-5">
              <label
                htmlFor="fullName"
                className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-1 sm:mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                {...register("fullName")}
                className="w-full p-3 sm:p-4 md:p-5 text-base sm:text-lg border border-gray-300 dark:border-gray-700 rounded-lg sm:rounded-xl mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-2">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                {...register("email")}
                className="w-full p-3 sm:p-4 md:p-5 text-base sm:text-lg border border-gray-300 dark:border-gray-700 rounded-lg sm:rounded-xl mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-2">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div className="mb-5">
              <label
                htmlFor="phone"
                className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                Phone Number
              </label>
              <input
                type="text"
                id="phone"
                {...register("phone")}
                className="w-full p-3 sm:p-4 md:p-5 text-base sm:text-lg border border-gray-300 dark:border-gray-700 rounded-lg sm:rounded-xl mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-2">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Referral Code */}
            <div className="mb-5">
              <label
                htmlFor="referralCode"
                className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                Referral Code (Optional)
              </label>
              <input
                type="text"
                id="referralCode"
                {...register("referralCode")}
                className="w-full p-3 sm:p-4 md:p-5 text-base sm:text-lg border border-gray-300 dark:border-gray-700 rounded-lg sm:rounded-xl mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter referral code"
              />
              {sponsorInfo && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-green-800 dark:text-green-300 text-sm">
                    ✓ Valid referral code! You will be sponsored by: <strong>{sponsorInfo.fullName}</strong>
                  </p>
                </div>
              )}
              {referralCode && referralCode.length > 3 && !sponsorInfo && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-2">
                  Invalid referral code
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                {...register("password")}
                className="w-full p-3 sm:p-4 md:p-5 text-base sm:text-lg border border-gray-300 dark:border-gray-700 rounded-lg sm:rounded-xl mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-2">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-5">
              <label
                htmlFor="confirmPassword"
                className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                {...register("confirmPassword")}
                className="w-full p-3 sm:p-4 md:p-5 text-base sm:text-lg border border-gray-300 dark:border-gray-700 rounded-lg sm:rounded-xl mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-2">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* Address - Full Width */}
          <div className="mb-6 sm:mb-8">
            <label
              htmlFor="address"
              className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-1 sm:mb-2"
            >
              Address
            </label>
            <input
              type="text"
              id="address"
              {...register("address")}
              className="w-full p-3 sm:p-4 md:p-5 text-base sm:text-lg border border-gray-300 dark:border-gray-700 rounded-lg sm:rounded-xl mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your address"
            />
            {errors.address && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-2">
                {errors.address.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 shadow-lg"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
