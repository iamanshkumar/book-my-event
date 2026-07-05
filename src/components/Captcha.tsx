"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface CaptchaProps {
  siteKey: string;
  onChange: (token: string | null) => void;
}

export default function Captcha({ siteKey, onChange }: CaptchaProps) {
  const [isMock, setIsMock] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!siteKey || siteKey === "MOCK" || siteKey.trim() === "") {
      setIsMock(true);
      return;
    }

    // Otherwise, load real script
    const scriptId = "google-recaptcha-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    // Set callback
    (window as any).onRecaptchaVerify = (token: string) => {
      onChange(token);
    };

    (window as any).onRecaptchaExpired = () => {
      onChange(null);
    };
  }, [siteKey]);

  const handleMockClick = () => {
    if (loading || isChecked) return;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setIsChecked(true);
      onChange("MOCK_VALIDATION_TOKEN");
    }, 1200);
  };

  if (isMock) {
    return (
      <div
        onClick={handleMockClick}
        className="flex items-center justify-between p-4 bg-card border border-border/80 rounded-lg cursor-pointer select-none max-w-sm hover:bg-foreground/[0.01] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 border border-border/80 rounded bg-background flex items-center justify-center relative">
            {loading && (
              <Loader2 className="h-4.5 w-4.5 animate-spin text-primary" />
            )}
            {isChecked && (
              <svg
                className="h-4.5 w-4.5 text-green-500 fill-none stroke-current"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          <span className="text-xs font-medium text-foreground/80">
            I&apos;m not a robot
          </span>
        </div>
        <div className="flex flex-col items-center">
          <img
            src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
            alt="reCAPTCHA"
            className="h-7 w-7 opacity-75"
          />
          <span className="text-[8px] text-foreground/35 font-semibold uppercase tracking-widest mt-0.5">
            reCAPTCHA
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="g-recaptcha"
      data-sitekey={siteKey}
      data-callback="onRecaptchaVerify"
      data-expired-callback="onRecaptchaExpired"
      data-theme="dark"
    />
  );
}
