import React, { useRef, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface ReCaptchaProps {
  onVerify: (token: string | null) => void;
  siteKey: string;
  className?: string;
}

export const ReCaptcha: React.FC<ReCaptchaProps> = ({ onVerify, siteKey, className = '' }) => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleChange = (token: string | null) => {
    onVerify(token);
  };

  const reset = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  // Expose reset method to parent component
  useEffect(() => {
    if (recaptchaRef.current) {
      (recaptchaRef.current as any).reset = reset;
    }
  }, []);

  // In development mode, automatically provide a dummy token
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('reCAPTCHA: Auto-providing dummy token in development mode');
      onVerify('development-dummy-token');
    }
  }, [onVerify]);
  console.log(import.meta.env.DEV)
  // Don't render the actual reCAPTCHA widget in development mode
  if (import.meta.env.DEV) {
    return (
      <div className={`flex justify-center ${className}`}>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
          ✅ reCAPTCHA disabled in development mode
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={handleChange}
        theme="light"
        size="normal"
      />
    </div>
  );
};
