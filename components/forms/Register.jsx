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
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-2">
      <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 flex flex-col items-center">
        <Image src={"/images/brand-logo.png"} width={80} height={80} alt="WearEarn Logo" className="mb-4 rounded-full border-2 border-amber-500 bg-white dark:bg-gray-800" />
        <h1 className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2 tracking-tight">Join WearEarn</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">Create your account</p>
        {/* <h2 className="text-2xl font-semibold text-center mb-6">Register</h2> */}

        {/* FORM DETAILS INCLUDES IN USER -> FULLNAME , CONTACT , EMAIL,ADDRESS , PASSWORD , CREATED-AT, SPONSER-ID AND ID */}

        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
          {/* Full Name */}
          <div className="mb-5">
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              {...register("fullName")}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your full name"
            />
            {errors.fullName && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="mb-5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              {...register("email")}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Referral Code */}
          <div className="mb-5">
            <label
              htmlFor="referralCode"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Referral Code (Optional)
            </label>
            <input
              type="text"
              id="referralCode"
              {...register("referralCode")}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter referral code"
            />
            {sponsorInfo && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded">
                <p className="text-green-800 dark:text-green-300 text-sm">
                  ✓ Valid referral code! You will be sponsored by: <strong>{sponsorInfo.fullName}</strong>
                </p>
              </div>
            )}
            {referralCode && referralCode.length > 3 && !sponsorInfo && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                Invalid referral code
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="mb-4">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Phone Number
            </label>
            <input
              type="text"
              id="phone"
              {...register("phone")}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your phone number"
            />
            {errors.phone && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="mb-4">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Address
            </label>
            <input
              type="text"
              id="address"
              {...register("address")}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your address"
            />
            {errors.address && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                {errors.address.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              {...register("password")}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              {...register("confirmPassword")}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="mb-4 text-left">
            <button
              type="submit"
              className="w-fit cursor-pointer p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
