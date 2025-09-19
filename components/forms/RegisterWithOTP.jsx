"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import OTPModal from "@/components/ui/OTPModal";

// Validation schema using Yup
const schema = Yup.object().shape({
  fullName: Yup.string()
    .min(3, "Full Name must be at least 3 characters")
    .required("Full Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .optional(),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .required("Phone number is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm Password is required"),
  referralCode: Yup.string().optional(),
});

const RegisterWithOTP = ({ setIsLogin }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sponsorInfo, setSponsorInfo] = useState(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const referralCode = watch("referralCode");

  useEffect(() => {
    // Check for referral code in URL - support both 'ref' and 'spid' parameters
    const urlReferralCode = searchParams.get('ref') || searchParams.get('spid');
    if (urlReferralCode) {
      setValue("referralCode", urlReferralCode);
    }
  }, [searchParams, setValue]);

  // Fetch sponsor info when referral code changes
  useEffect(() => {
    const fetchSponsorInfo = async () => {
      if (referralCode && referralCode.length > 0) {
        try {
          const response = await axios.get(`/api/register?spid=${referralCode}`);
          if (response.data.success && response.data.sponsor) {
            setSponsorInfo(response.data.sponsor);
          } else {
            setSponsorInfo(null);
          }
        } catch (error) {
          console.error('Error fetching sponsor info:', error);
          setSponsorInfo(null);
        }
      } else {
        setSponsorInfo(null);
      }
    };

    fetchSponsorInfo();
  }, [referralCode]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Store registration data for later use after OTP verification
      setRegistrationData({
        fullName: data.fullName,
        email: data.email || undefined,
        mobileNo: data.phone,
        password: data.password,
        referralCode: data.referralCode || undefined,
        spid: searchParams.get('spid') || undefined
      });

      // Send OTP
      const response = await axios.post('/api/auth/send-registration-otp', {
        email: data.email || undefined,
        mobileNo: data.phone
      });

      if (response.data.success) {
        toast.success('OTP sent successfully! Please check your email/SMS.');
        setShowOTPModal(true);
      } else {
        toast.error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = async (verifiedOTP) => {
    if (!registrationData) return;

    setIsLoading(true);
    try {
      // Complete registration with OTP
      const response = await axios.post('/api/auth/register-with-otp', {
        ...registrationData,
        otp: verifiedOTP
      });

      if (response.data.success) {
        toast.success('Registration successful! Logging you in...');
        
        // Automatically log the user in after successful registration
        try {
          const loginResult = await signIn("credentials", {
            email: registrationData.email || registrationData.mobileNo,
            password: registrationData.password,
            redirect: false,
          });

          if (loginResult?.ok) {
            toast.success('Welcome! Redirecting to dashboard...');
            router.push('/dashboard'); // Redirect to dashboard
          } else {
            toast.success('Registration successful! Please login manually.');
            setIsLogin(true); // Fallback to login form
          }
        } catch (loginError) {
          console.error('Auto-login failed:', loginError);
          toast.success('Registration successful! Please login manually.');
          setIsLogin(true); // Fallback to login form
        }
        
        reset();
        setRegistrationData(null);
        setShowOTPModal(false);
      } else {
        toast.error(response.data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration completion error:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Registration data sent:', { ...registrationData, otp: verifiedOTP });
      toast.error(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-3 sm:px-4">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl sm:shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col items-center">
        <Image 
          src={"/images/brand-logo.png"} 
          width={80} 
          height={80} 
          className="sm:w-[100px] sm:h-[100px] mb-4 sm:mb-6 rounded-full border-2 border-amber-500 bg-white dark:bg-gray-800" 
          alt="WearEarn Logo" 
        />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-600 dark:text-amber-400 mb-2 sm:mb-3 tracking-tight text-center">
          Join WearEarn
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 text-center">
          Create your account with OTP verification
        </p>

        {/* Sponsor Info Display */}
        {sponsorInfo && (
          <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="text-center">
              <p className="text-green-800 dark:text-green-300 font-medium">
                🎉 You're joining under sponsor:
              </p>
              <p className="text-green-900 dark:text-green-200 font-semibold text-lg">
                {sponsorInfo.name}
              </p>
              <p className="text-green-700 dark:text-green-400 text-sm">
                Referral Code: {sponsorInfo.referralCode}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl space-y-4 sm:space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              {...register("fullName")}
              className="w-full p-3 sm:p-4 text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Enter your full name"
            />
            {errors.fullName && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
              Email Address (Optional)
            </label>
            <input
              type="email"
              {...register("email")}
              className="w-full p-3 sm:p-4 text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Enter your email (optional)"
            />
            {errors.email && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
              Mobile Number *
            </label>
            <input
              type="tel"
              {...register("phone")}
              className="w-full p-3 sm:p-4 text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Enter your 10-digit mobile number"
            />
            {errors.phone && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="w-full p-3 sm:p-4 text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12"
                placeholder="Create a secure password"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 2.001 12c1.73 4.556 6.1 7.5 10.999 7.5 2.042 0 3.98-.488 5.657-1.354M19.07 15.607A10.45 10.45 0 0 0 21 12c-1.73-4.556-6.1-7.5-10.999-7.5a11.05 11.05 0 0 0-4.118.797M9.88 9.88a3 3 0 1 1 4.24 4.24M15 12a3 3 0 0 1-3 3m0 0a3 3 0 0 1-3-3m3 3L3 3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.001 12C3.73 7.444 8.1 4.5 13 4.5c4.899 0 9.269 2.944 10.999 7.5-1.73 4.556-6.1 7.5-10.999 7.5-4.899 0-9.269-2.944-10.999-7.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
                className="w-full p-3 sm:p-4 text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 2.001 12c1.73 4.556 6.1 7.5 10.999 7.5 2.042 0 3.98-.488 5.657-1.354M19.07 15.607A10.45 10.45 0 0 0 21 12c-1.73-4.556-6.1-7.5-10.999-7.5a11.05 11.05 0 0 0-4.118.797M9.88 9.88a3 3 0 1 1 4.24 4.24M15 12a3 3 0 0 1-3 3m0 0a3 3 0 0 1-3-3m3 3L3 3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.001 12C3.73 7.444 8.1 4.5 13 4.5c4.899 0 9.269 2.944 10.999 7.5-1.73 4.556-6.1 7.5-10.999 7.5-4.899 0-9.269-2.944-10.999-7.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Referral Code */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
              Referral Code (Optional)
            </label>
            <input
              type="text"
              {...register("referralCode")}
              className="w-full p-3 sm:p-4 text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Enter referral code (if any)"
            />
          </div>

          {/* Submit Button */}
          <div className="text-center pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full px-8 py-3 sm:py-4 text-base sm:text-lg rounded-lg transition-all duration-200 font-semibold
                ${isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-offset-2 transform hover:scale-105 active:scale-95 shadow-lg'
                }
                text-white
              `}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending OTP...
                </div>
              ) : (
                'Send OTP & Register'
              )}
            </button>
          </div>

          {/* Terms and Privacy Note */}
          <div className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 pt-4">
            By registering, you agree to our Terms of Service and Privacy Policy.
            <br />
            You will receive an OTP for verification.
          </div>
        </form>
      </div>

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
          setRegistrationData(null);
        }}
        onVerified={handleOTPVerified}
        email={registrationData?.email}
        mobileNo={registrationData?.mobileNo}
        type="registration"
        title="Verify Your Registration"
      />
    </div>
  );
};

export default RegisterWithOTP;