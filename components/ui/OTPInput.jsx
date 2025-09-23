"use client";

import { useState, useRef, useEffect, useCallback } from 'react';

const OTPInput = ({ 
  length = 6, 
  onComplete, 
  value = "", 
  onChange,
  disabled = false,
  autoFocus = true 
}) => {
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputRefs = useRef([]);
  const [webOTPSupported, setWebOTPSupported] = useState(false);
  const abortControllerRef = useRef(null);
  const [webOTPActive, setWebOTPActive] = useState(false);

  // Check for WebOTP API support
  useEffect(() => {
    if ('OTPCredential' in window) {
      setWebOTPSupported(true);
    }
  }, []);

  useEffect(() => {
    if (value) {
      const otpArray = value.split("").slice(0, length);
      const filledArray = [...otpArray, ...new Array(length - otpArray.length).fill("")];
      setOtp(filledArray);
    }
  }, [value, length]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Function to start WebOTP listening
  const startWebOTPListener = useCallback(() => {
    if (!webOTPSupported || disabled || webOTPActive) return;

    // Abort previous listener if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setWebOTPActive(true);
    
    const startWebOTP = async () => {
      try {
        console.log('🔍 Starting WebOTP listener...');
        const credential = await navigator.credentials.get({
          otp: { transport: ['sms'] },
          signal: abortControllerRef.current.signal
        });
        
        if (credential && credential.code) {
          console.log('📱 WebOTP received:', credential.code);
          const otpCode = credential.code.replace(/\D/g, '').slice(0, length);
          
          if (otpCode.length > 0) {
            const otpArray = otpCode.split('');
            const filledArray = [...otpArray, ...new Array(length - otpArray.length).fill("")];
            setOtp(filledArray);
            
            if (onChange) {
              onChange(otpCode);
            }
            
            // Call onComplete if we have the full code
            if (otpCode.length === length && onComplete) {
              onComplete(otpCode);
            }
          }
        }
      } catch (error) {
        console.log('WebOTP ended:', error.name);
      } finally {
        setWebOTPActive(false);
      }
    };

    startWebOTP();
  }, [webOTPSupported, disabled, webOTPActive, length, onChange, onComplete]);

  // Start WebOTP on component mount
  useEffect(() => {
    if (webOTPSupported && !disabled) {
      startWebOTPListener();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [startWebOTPListener, webOTPSupported, disabled]);

  // Restart WebOTP when user focuses on any input (user gesture)
  const handleInputFocus = useCallback(() => {
    // Restart WebOTP listener if it's not active and we have support
    if (webOTPSupported && !webOTPActive && !disabled) {
      setTimeout(() => {
        startWebOTPListener();
      }, 100);
    }
  }, [webOTPSupported, webOTPActive, disabled, startWebOTPListener]);

  const handleChange = (element, index) => {
    if (disabled) return;
    
    const inputValue = element.value;
    
    // Handle multi-digit input (from autofill or paste)
    if (inputValue.length > 1) {
      const otpCode = inputValue.replace(/\D/g, '').slice(0, length);
      if (otpCode.length > 0) {
        const otpArray = otpCode.split('');
        const filledArray = [...otpArray, ...new Array(length - otpArray.length).fill("")];
        setOtp(filledArray);
        
        if (onChange) {
          onChange(otpCode);
        }
        
        // Focus the next empty input or the last input
        const nextEmptyIndex = Math.min(otpCode.length, length - 1);
        if (inputRefs.current[nextEmptyIndex]) {
          inputRefs.current[nextEmptyIndex].focus();
        }
        
        // Call onComplete if all fields are filled
        if (otpCode.length === length && onComplete) {
          onComplete(otpCode);
        }
      }
      return;
    }
    
    if (isNaN(inputValue)) return false;

    const newOtp = [...otp];
    newOtp[index] = inputValue;
    setOtp(newOtp);

    // Call onChange callback
    if (onChange) {
      onChange(newOtp.join(""));
    }

    // Focus next input
    if (element.nextSibling && inputValue !== "") {
      element.nextSibling.focus();
    }

    // Call onComplete when all fields are filled
    if (newOtp.every(digit => digit !== "") && onComplete) {
      onComplete(newOtp.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (disabled) return;
    
    // Handle backspace
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      
      if (otp[index] !== "") {
        newOtp[index] = "";
        setOtp(newOtp);
        if (onChange) {
          onChange(newOtp.join(""));
        }
      } else if (index > 0) {
        // Focus previous input and clear it
        inputRefs.current[index - 1].focus();
        newOtp[index - 1] = "";
        setOtp(newOtp);
        if (onChange) {
          onChange(newOtp.join(""));
        }
      }
    }
    // Handle arrow keys
    else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    if (disabled) return;
    
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '');
    
    if (pasteData.length > 0) {
      const newOtp = pasteData.split('').slice(0, length);
      const filledArray = [...newOtp, ...new Array(length - newOtp.length).fill("")];
      setOtp(filledArray);
      
      if (onChange) {
        onChange(newOtp.join(""));
      }
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = Math.min(newOtp.length, length - 1);
      if (inputRefs.current[nextEmptyIndex]) {
        inputRefs.current[nextEmptyIndex].focus();
      }
      
      // Call onComplete if all fields are filled
      if (newOtp.length === length && onComplete) {
        onComplete(newOtp.join(""));
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2 justify-center relative">
        {/* Hidden input for SMS autofill - better positioned for mobile browsers */}
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          style={{
            position: 'absolute',
            left: '0',
            top: '0',
            width: '100%',
            height: '100%',
            opacity: 0,
            pointerEvents: 'auto',
            zIndex: 10
          }}
          onFocus={handleInputFocus}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, length);
            if (value.length > 0) {
              console.log('📋 Autocomplete filled:', value);
              const otpArray = value.split('');
              const filledArray = [...otpArray, ...new Array(length - otpArray.length).fill("")];
              setOtp(filledArray);
              
              if (onChange) {
                onChange(value);
              }
              
              if (value.length === length && onComplete) {
                onComplete(value);
              }
              
              // Focus visible inputs for better UX
              if (inputRefs.current[0]) {
                inputRefs.current[0].focus();
              }
            }
          }}
        />
        
        {otp.map((data, index) => {
        return (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength="1"
            ref={(el) => (inputRefs.current[index] = el)}
            value={data}
            onChange={(e) => handleChange(e.target, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            onFocus={(e) => {
              e.target.select();
              handleInputFocus();
            }}
            disabled={disabled}
            autoComplete="off"
            className={`
              w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg
              transition-all duration-200 outline-none
              ${disabled 
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }
              dark:bg-gray-700 dark:border-gray-600 dark:text-white 
              dark:focus:border-blue-400 dark:focus:ring-blue-800
            `}
          />
        );
      })}
      </div>
    </div>
  );
};

export default OTPInput;