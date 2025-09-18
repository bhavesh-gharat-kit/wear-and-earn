"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import OTPInput from './OTPInput';

const OTPModal = ({ 
  isOpen, 
  onClose, 
  onVerified, 
  email, 
  mobileNo, 
  type = 'registration', // 'registration' or 'forgot-password'
  title
}) => {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Start countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setCountdown(60); // 60 seconds countdown
      setOtp('');
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOTPComplete = (otpValue) => {
    setOtp(otpValue);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter complete 6-digit OTP');
      return;
    }

    // For registration, just pass the OTP to parent without verifying here
    // The verification will happen in the registration endpoint
    if (type === 'registration') {
      toast.success('OTP entered successfully!');
      onVerified && onVerified(otp);
      onClose();
      return;
    }

    // For other types (like password reset), verify the OTP
    setIsVerifying(true);
    try {
      const response = await axios.post('/api/auth/verify-otp', {
        email,
        mobileNo,
        otp
      });

      if (response.data.success) {
        toast.success('OTP verified successfully!');
        onVerified && onVerified(otp);
        onClose();
      } else {
        toast.error(response.data.message || 'OTP verification failed');
        setOtp('');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error(error.response?.data?.message || 'OTP verification failed');
      setOtp('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    try {
      const endpoint = type === 'registration' 
        ? '/api/auth/send-registration-otp' 
        : '/api/auth/send-forgot-password-otp';
      
      const response = await axios.post(endpoint, {
        email,
        mobileNo
      });

      if (response.data.success) {
        toast.success('OTP sent successfully!');
        setCountdown(60);
        setOtp('');
      } else {
        toast.error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          disabled={isVerifying}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {title || 'Enter Verification Code'}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            We've sent a 6-digit code to:
          </p>
          
          <div className="mt-2 space-y-1">
            {email && (
              <p className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                📧 {email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
              </p>
            )}
            {mobileNo && (
              <p className="text-green-600 dark:text-green-400 font-medium text-sm">
                📱 {mobileNo.replace(/(.{3})(.*)(.{2})/, '$1***$3')}
              </p>
            )}
          </div>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <OTPInput
            length={6}
            value={otp}
            onChange={setOtp}
            onComplete={handleOTPComplete}
            disabled={isVerifying}
          />
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerifyOTP}
          disabled={otp.length !== 6 || isVerifying}
          className={`
            w-full py-3 rounded-lg font-semibold transition-all duration-200
            ${otp.length === 6 && !isVerifying
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isVerifying ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </div>
          ) : (
            'Verify OTP'
          )}
        </button>

        {/* Resend OTP */}
        <div className="mt-4 text-center">
          {countdown > 0 ? (
            <p className="text-gray-500 text-sm">
              Resend OTP in {countdown} seconds
            </p>
          ) : (
            <button
              onClick={handleResendOTP}
              disabled={isResending}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isResending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                "Didn't receive code? Resend OTP"
              )}
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            The verification code will expire in 5 minutes.
            <br />
            Please check your spam folder if you don't receive the email.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPModal;