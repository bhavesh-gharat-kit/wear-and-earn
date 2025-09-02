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
    <>
      <div className="flex items-center justify-center py-4 gap-4 max-sm:flex-col" > 
        <Image src={"/images/brand-logo.png"} className="w-6/12" width={300} height={300} alt="brand-logo" />
        <h1 className="text-3xl font-semibold text-amber-600">Login Page</h1>
      </div>

      <div className="w-full mx-auto p-6 bg-white rounded-lg shadow-md max-sm:px-2 ">
        {/* <h2 className="text-2xl font-semibold text-center mb-6">Login</h2> */}

        <div>
          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-md mb-4 text-sm text-center font-medium">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Email */}
          <div className="mb-4">
            <label
              htmlFor="mobileNo"
              className="block text-sm font-medium text-gray-700"
            >
              mobileNo
            </label>
            <input
              type="text"
              id="mobileNo"
              {...register("mobileNo")}
              className="w-full p-3 border rounded-md mt-2"
              placeholder="Enter your mobile number"
            />
            {errors.mobileNo && (
              <p className="text-red-500 text-xs mt-1">
                {errors.mobileNo.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              {...register("password")}
              className="w-full p-3 border rounded-md mt-2"
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="mb-4 text-left">
            <button
              type="submit"
              className="w-fit cursor-pointer p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Login;
