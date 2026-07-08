"use client";

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Loader2 } from "lucide-react";

interface CaptchaProps {
  type: string;
  siteKey: string;
  onChange: (token: string | null) => void;
}

export interface CaptchaRef {
  execute: () => Promise<string | null>;
  reset: () => void;
}

export const Captcha = forwardRef<CaptchaRef, CaptchaProps>(({ type, siteKey, onChange }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetId, setWidgetId] = useState<number | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Keep resolve function in a ref for invisible v2 callback execution
  const resolveRef = useRef<((token: string | null) => void) | null>(null);

  const isMockKey = !siteKey || siteKey === "MOCK" || siteKey.trim() === "";

  useEffect(() => {
    if (type === "NONE") return;

    if (isMockKey) {
      setIsMock(true);
      return;
    }
    setIsMock(false);

    // Dynamic script injection
    const scriptId = "google-recaptcha-script";
    const existingScript = document.getElementById(scriptId);

    const onScriptLoad = () => {
      if (type === "V3") {
        // v3 doesn't need programmatic rendering inside a div, just initialization
        return;
      }

      // V2 Checkbox or V2 Invisible
      if (containerRef.current && (window as any).grecaptcha) {
        try {
          // Clear any previous children in container
          containerRef.current.innerHTML = "";
          const widget = (window as any).grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            size: type === "V2_INVISIBLE" ? "invisible" : "normal",
            theme: "dark",
            callback: (token: string) => {
              onChange(token);
              if (resolveRef.current) {
                resolveRef.current(token);
                resolveRef.current = null;
              }
            },
            "expired-callback": () => {
              onChange(null);
              if (resolveRef.current) {
                resolveRef.current(null);
                resolveRef.current = null;
              }
            },
            "error-callback": () => {
              onChange(null);
              if (resolveRef.current) {
                resolveRef.current(null);
                resolveRef.current = null;
              }
            }
          });
          setWidgetId(widget);
        } catch (e) {
          console.error("Failed to render recaptcha widget:", e);
        }
      }
    };

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = type === "V3" 
        ? `https://www.google.com/recaptcha/api.js?render=${siteKey}`
        : "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Wait briefly for grecaptcha object to initialize fully
        setTimeout(onScriptLoad, 100);
      };
      document.body.appendChild(script);
    } else {
      // Script already exists in DOM
      if ((window as any).grecaptcha) {
        onScriptLoad();
      } else {
        existingScript.addEventListener("load", onScriptLoad);
      }
    }

    return () => {
      // Reset state if type/key changes
      setWidgetId(null);
    };
  }, [type, siteKey, isMockKey]);

  useImperativeHandle(ref, () => ({
    execute: () => {
      if (type === "NONE") {
        return Promise.resolve(null);
      }

      if (isMockKey) {
        onChange("MOCK_VALIDATION_TOKEN");
        return Promise.resolve("MOCK_VALIDATION_TOKEN");
      }

      if (type === "V3") {
        return new Promise((resolve) => {
          if (!(window as any).grecaptcha) {
            resolve(null);
            return;
          }
          (window as any).grecaptcha.ready(async () => {
            try {
              const token = await (window as any).grecaptcha.execute(siteKey, { action: "submit" });
              onChange(token);
              resolve(token);
            } catch (err) {
              console.error("V3 Execution Error:", err);
              onChange(null);
              resolve(null);
            }
          });
        });
      }

      if (type === "V2_INVISIBLE") {
        return new Promise((resolve) => {
          if (widgetId !== null && (window as any).grecaptcha) {
            resolveRef.current = resolve;
            (window as any).grecaptcha.execute(widgetId);
          } else {
            resolve(null);
          }
        });
      }

      // Checkbox captcha expects user action
      return Promise.resolve(null);
    },
    reset: () => {
      setIsChecked(false);
      setLoading(false);
      onChange(null);
      if (widgetId !== null && (window as any).grecaptcha) {
        (window as any).grecaptcha.reset(widgetId);
      }
    }
  }));

  const handleMockClick = () => {
    if (loading || isChecked) return;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setIsChecked(true);
      onChange("MOCK_VALIDATION_TOKEN");
    }, 1200);
  };

  if (type === "NONE") return null;

  if (isMock) {
    // Return standard Mock Checkbox UI for developer local test
    return (
      <div
        onClick={handleMockClick}
        className="flex items-center justify-between p-4 bg-card border border-border/80 rounded-lg cursor-pointer select-none max-w-sm hover:bg-foreground/[0.01] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 border border-border/80 rounded bg-background flex items-center justify-center relative">
            {loading && <Loader2 className="h-4.5 w-4.5 animate-spin text-primary" />}
            {isChecked && (
              <svg className="h-4.5 w-4.5 text-green-500 fill-none stroke-current" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-xs font-medium text-foreground/80">
            I&apos;m not a robot (Mock {type === "V3" ? "v3" : type === "V2_INVISIBLE" ? "Invisible" : "Checkbox"})
          </span>
        </div>
        <div className="flex flex-col items-center">
          <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="h-7 w-7 opacity-75" />
          <span className="text-[8px] text-foreground/35 font-semibold uppercase tracking-widest mt-0.5">reCAPTCHA</span>
        </div>
      </div>
    );
  }

  // Return programmatic container for Checkbox and Invisible recaptcha.
  // v3 doesn't render visual container widget.
  if (type === "V3") return null;

  return <div ref={containerRef} />;
});

Captcha.displayName = "Captcha";
export default Captcha;
