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
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-2">
      <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 flex flex-col items-center">
        <Image src={"/images/brand-logo.png"} width={80} height={80} alt="WearEarn Logo" className="mb-4 rounded-full border-2 border-amber-500 bg-white dark:bg-gray-800" />
        <h1 className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2 tracking-tight">Welcome to WearEarn</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">Sign in to your account</p>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-4 py-2 rounded-md mb-4 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
          {/* Mobile Number */}
          <div className="mb-5">
            <label
              htmlFor="mobileNo"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Mobile Number
            </label>
            <input
              type="text"
              id="mobileNo"
              {...register("mobileNo")}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your mobile number"
            />
            {errors.mobileNo && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                {errors.mobileNo.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mb-5">
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

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 dark:bg-blue-500 text-white font-semibold rounded-lg shadow hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
