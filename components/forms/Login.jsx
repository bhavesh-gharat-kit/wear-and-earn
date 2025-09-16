"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { signIn } from "next-auth/react";
import Image from "next/image";

// Validation schema using Yup
const schema = Yup.object().shape({
  mobileNo: Yup.string()
    .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .required("Phone number is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const Login = () => {
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema), // Using the Yup resolver for validation
  });

  // authentication while logging using mobile number and password
  const onSubmit = async (data) => {
    await signIn("credentials", {
      mobileNo: data.mobileNo,
      password: data.password,
      redirect: true,
      callbackUrl: "/", // Redirect to home page with proper layout
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-3 sm:px-4">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl sm:shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col items-center">
        <Image src={"/images/brand-logo.png"} width={80} height={80} className="sm:w-[100px] sm:h-[100px] mb-4 sm:mb-6 rounded-full border-2 border-amber-500 bg-white dark:bg-gray-800" alt="WearEarn Logo" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-600 dark:text-amber-400 mb-2 sm:mb-3 tracking-tight text-center">Welcome to WearEarn</h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 text-center">Sign in to your account</p>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-3 sm:px-4 md:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6 text-sm sm:text-base text-center font-medium border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl">
          {/* Mobile-Enhanced Mobile Number */}
          <div className="mb-4 sm:mb-6">
            <label
              htmlFor="mobileNo"
              className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-2"
            >
              Mobile Number
            </label>
            <input
              type="text"
              id="mobileNo"
              {...register("mobileNo")}
              className="w-full p-3 sm:p-4 md:p-5 text-base sm:text-lg border border-gray-300 dark:border-gray-700 rounded-lg sm:rounded-xl mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Enter your mobile number"
            />
            {errors.mobileNo && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-2">
                {errors.mobileNo.message}
              </p>
            )}
          </div>

          {/* Mobile-Enhanced Password */}
          <div className="mb-6 sm:mb-8">
            <label
              htmlFor="password"
              className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              {...register("password")}
              className="w-full p-3 sm:p-4 md:p-5 text-base sm:text-lg border border-gray-300 dark:border-gray-700 rounded-lg sm:rounded-xl mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-2">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Mobile-Enhanced Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 sm:px-10 md:px-12 py-3 sm:py-4 text-base sm:text-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg sm:rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 active:scale-95 shadow-lg font-semibold"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
