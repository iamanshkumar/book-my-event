"use client";

import { useState , useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import Captcha  from "@/components/Captcha";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [captchaEnabled, setCaptchaEnabled] = useState(false);
  const [siteKey, setSiteKey] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [termsEnabled, setTermsEnabled] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);


  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        setCaptchaEnabled(data.captchaEnabledRegister);
        setSiteKey(data.captchaSiteKey || "MOCK");
        setTermsEnabled(data.signupTermsEnabled || false);
      } catch (e) {
        // ignore
      }
    }
    loadConfig();
  }, []);
  


  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (captchaEnabled && !captchaToken) {
      toast.error("Validation Required", {
        description: "Please complete captcha verification check.",
      });
      return;
    }

    if (termsEnabled && !acceptTerms) {
      toast.error("Terms & Conditions Required", {
        description: "You must accept the terms and conditions to register.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "CUSTOMER", recaptchaToken: captchaToken, acceptTerms })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed. Please try again.");
      }

      toast.success("Account created successfully!", {
        description: "Redirecting you to the login panel...",
      });

      setTimeout(() => {
        router.push("/login");
      }, 1600);
    } catch (err: any) {
      toast.error("Registration Failed", {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black relative">
      <div className="absolute top-6 left-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-xs font-semibold text-foreground/60 hover:text-foreground hover:bg-foreground/5 h-9 px-3 rounded-md transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm border border-border bg-card p-2 rounded-lg shadow-sm">
        <CardHeader className="space-y-1.5 text-center pt-6">
          <CardTitle className="text-2xl font-semibold tracking-tight text-card-foreground">
            Attendee Registration
          </CardTitle>
          <CardDescription className="text-sm text-foreground/60">
            Sign up to discover live experiences and book gate passes
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4 pt-4">
            {/* Full Name Input */}
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-xs font-medium text-foreground/80"
              >
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10 bg-transparent border-border rounded-md px-3 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all text-card-foreground text-sm"
              />
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-medium text-foreground/80"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 bg-transparent border-border rounded-md px-3 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all text-card-foreground text-sm"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-medium text-foreground/80"
              >
                Password
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 w-full bg-transparent border-border rounded-md pl-3 pr-10 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all text-card-foreground text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-foreground/40 hover:text-foreground transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 stroke-[1.5]" />
                  ) : (
                    <Eye className="h-4 w-4 stroke-[1.5]" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Conditions Acceptance */}
            {termsEnabled && (
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="h-4 w-4 mt-0.5 accent-primary rounded border-border cursor-pointer shrink-0"
                  required
                />
                <Label
                  htmlFor="acceptTerms"
                  className="text-[11px] font-normal leading-tight text-foreground/70 cursor-pointer select-none"
                >
                  I accept the{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-semibold hover:underline"
                  >
                    Terms & Conditions
                  </a>
                </Label>
              </div>
            )}
          </CardContent>

          {captchaEnabled && (
            <div className="my-4">
              <Captcha
                siteKey={siteKey}
                onChange={(token) => setCaptchaToken(token)}
              />
            </div>
          )}

          <CardFooter className="flex flex-col space-y-4 pt-4 pb-6">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-md text-sm transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Get Started"
              )}
            </Button>

            <div className="text-center text-xs text-foreground/50 font-normal space-y-2">
              <div>
                Already have an account?{" "}
                <Button
                  variant="link"
                  type="button"
                  onClick={() => router.push("/login")}
                  className="p-0 text-xs text-foreground font-semibold h-auto py-0 hover:underline"
                >
                  Sign in
                </Button>
              </div>
              <div className="pt-2 border-t border-border/40">
                Are you hosting events?{" "}
                <Button
                  variant="link"
                  type="button"
                  onClick={() => router.push("/register/organizer")}
                  className="p-0 text-xs text-primary font-semibold h-auto py-0 hover:underline"
                >
                  Register as Organizer
                </Button>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}