"use client";

import { useState, useRef, useEffect } from 'react';

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
  const webOTPRequestRef = useRef(null);

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
    if (autoFocus && inputRefs.current[0] && !disabled) {
      // Small delay to ensure proper focus
      setTimeout(() => {
        inputRefs.current[0].focus();
      }, 100);
    }
  }, [autoFocus, disabled]);

  // WebOTP implementation
  useEffect(() => {
    if (!webOTPSupported || disabled) return;

    const requestWebOTP = () => {
      if (webOTPRequestRef.current) {
        webOTPRequestRef.current.abort();
      }

      const ac = new AbortController();
      webOTPRequestRef.current = ac;
      
      navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: ac.signal
      }).then(credential => {
        if (credential?.code) {
          console.log('📱 WebOTP received:', credential.code);
          const otpCode = credential.code.replace(/\D/g, '');
          
          if (otpCode.length > 0) {
            console.log('✅ Filling OTP from WebOTP:', otpCode);
            const otpArray = otpCode.split('').slice(0, length);
            const filledArray = [...otpArray, ...new Array(length - otpArray.length).fill("")];
            setOtp(filledArray);
            
            if (onChange) onChange(otpCode.slice(0, length));
            if (otpCode.length >= length && onComplete) {
              onComplete(otpCode.slice(0, length));
            }
          }
        }
      }).catch(error => {
        if (error.name !== 'AbortError') {
          console.log('WebOTP error:', error.name);
        }
      });
    };

    requestWebOTP();

    return () => {
      if (webOTPRequestRef.current) {
        webOTPRequestRef.current.abort();
        webOTPRequestRef.current = null;
      }
    };
  }, [webOTPSupported, disabled, length, onChange, onComplete]);

  const handleInputFocus = () => {
    // Trigger WebOTP when user focuses on input
    if (webOTPSupported && !disabled) {
      console.log('🎯 Input focused, requesting WebOTP...');
    }
  };

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
    <div className="flex flex-col items-center gap-4">
      {/* Status indicator */}
      {webOTPSupported && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          📱 WebOTP Ready - SMS autofill available
        </div>
      )}
      
      <div className="flex gap-2 justify-center relative">
        {/* Primary autofill input - this is the key fix */}
        <input
          type="tel"
          autoComplete="one-time-code"
          inputMode="numeric"
          name="otp"
          id="otp-input"
          aria-label="One-time passcode"
          style={{
            position: 'absolute',
            left: '0',
            top: '0',
            width: '100%',
            height: '100%',
            opacity: 0,
            zIndex: 10,
            fontSize: '16px', // Prevents zoom on iOS
            border: 'none',
            background: 'transparent'
          }}
          onFocus={handleInputFocus}
          onInput={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, length);
            if (value.length > 0) {
              console.log('🎯 Primary autofill input:', value);
              const otpArray = value.split('');
              const filledArray = [...otpArray, ...new Array(length - otpArray.length).fill("")];
              setOtp(filledArray);
              
              if (onChange) {
                onChange(value);
              }
              
              if (value.length === length && onComplete) {
                onComplete(value);
              }
              
              // Focus first visible input after autofill
              setTimeout(() => {
                if (inputRefs.current[0]) {
                  inputRefs.current[0].focus();
                }
              }, 50);
            }
          }}
        />
        
        {otp.map((data, index) => {
          return (
            <input
              key={index}
              type="tel"
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
                transition-all duration-200 outline-none relative z-1
                ${disabled 
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-gray-400'
                }
                dark:bg-gray-700 dark:border-gray-600 dark:text-white 
                dark:focus:border-blue-400 dark:focus:ring-blue-800 dark:hover:border-gray-500
              `}
              style={{ fontSize: '16px' }} // Prevents zoom on iOS
            />
          );
        })}
      </div>
      
      {/* Instructions for users */}
      <div className="text-xs text-gray-500 text-center max-w-xs">
        Enter the 6-digit code sent to your phone. Tap any field to use SMS autofill.
      </div>
    </div>
  );
};

// Demo component
const OTPDemo = () => {
  const [otpValue, setOtpValue] = useState("");
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            Verify Your Phone
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
            We sent a verification code to your mobile number
          </p>
          
          <OTPInput
            length={6}
            value={otpValue}
            onChange={setOtpValue}
            onComplete={(otp) => {
              console.log("OTP Complete:", otp);
              alert(`OTP Entered: ${otp}`);
            }}
            autoFocus={true}
          />
          
          <div className="mt-6 text-center">
            <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
              Didn't receive code? Resend
            </button>
          </div>
          
          {otpValue && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current OTP: </span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{otpValue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPDemo;