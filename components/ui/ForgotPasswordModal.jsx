"use client";

import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import OTPModal from './OTPModal';

const ForgotPasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Enter email/mobile, 2: OTP verification, 3: Reset password
  const [formData, setFormData] = useState({
    email: '',
    mobileNo: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);

  const resetForm = () => {
    setFormData({
      email: '',
      mobileNo: '',
      otp: '',
      newPassword: '',
      confirmPassword: ''
    });
    setStep(1);
    setShowOTPModal(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!formData.email && !formData.mobileNo) {
      toast.error('Please enter email or mobile number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/send-forgot-password-otp', {
        email: formData.email || undefined,
        mobileNo: formData.mobileNo || undefined
      });

      if (response.data.success) {
        toast.success('OTP sent successfully!');
        setShowOTPModal(true);
      } else {
        toast.error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = (verifiedOTP) => {
    setFormData(prev => ({ ...prev, otp: verifiedOTP }));
    setShowOTPModal(false);
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!formData.newPassword || formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/reset-password', {
        email: formData.email || undefined,
        mobileNo: formData.mobileNo || undefined,
        otp: formData.otp,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        toast.success('Password reset successfully!');
        onSuccess && onSuccess();
        handleClose();
      } else {
        toast.error(response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Step 1: Enter Email/Mobile */}
          {step === 1 && (
            <div>
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2H7v-2H4a1 1 0 01-1-1v-1.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Forgot Password?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Enter your email or mobile number to receive a verification code
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value, mobileNo: e.target.value ? '' : prev.mobileNo }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                  OR
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={formData.mobileNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobileNo: e.target.value, email: e.target.value ? '' : prev.email }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your mobile number"
                  />
                </div>

                <button
                  type="submit"
                  disabled={(!formData.email && !formData.mobileNo) || isLoading}
                  className={`
                    w-full py-3 rounded-lg font-semibold transition-all duration-200
                    ${(formData.email || formData.mobileNo) && !isLoading
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending OTP...
                    </div>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <div>
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Create New Password
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Enter your new password below
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter new password"
                    minLength="6"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Confirm new password"
                    minLength="6"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!formData.newPassword || !formData.confirmPassword || isLoading}
                  className={`
                    w-full py-3 rounded-lg font-semibold transition-all duration-200
                    ${formData.newPassword && formData.confirmPassword && !isLoading
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting...
                    </div>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerified={handleOTPVerified}
        email={formData.email}
        mobileNo={formData.mobileNo}
        type="forgot-password"
        title="Verify Your Identity"
      />
    </>
  );
};

export default ForgotPasswordModal;