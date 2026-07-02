"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { Loader2 , Eye , EyeOff, ArrowLeft } from "lucide-react";

import { toast } from "sonner";

export default function LoginPage(){
    const router = useRouter();

    const [email , setEmail] = useState("");
    const [password , setPassword] = useState("");
    const [loading , setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);


    const handleLogin = async(e : React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        setLoading(true);

        try{
            const response = await fetch("/api/auth/login" , {
                method : "POST",
                headers : {"Content-Type" : "application/json"},
                body : JSON.stringify({email , password})
            });

            const data = await response.json();

            if(!response.ok){
                throw new Error (data.error || "Invalid credentials ");
            }

            toast.success("Welcome back!" , {
                description: `Redirecting your workspace...`
            });

            const role = data.user?.role;
            if(role==="ADMIN"){
                router.push("/admin/dashboard");
            }else if(role==="ORGANIZER"){
                router.push("/organizer/dashboard");
            }else{
                router.push("/dashboard");
            }
        }catch(err : any){
            toast.error("Authentication failed" , {
                description: err.message,
            })
        }finally{
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 font-sans selection:bg-black selection:text-white relative">
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
                Sign In
              </CardTitle>
              <CardDescription className="text-sm text-foreground/60">
                Enter your details below to access your account
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-foreground/80">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-10 bg-transparent border-border rounded-md px-3 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
                  />
                </div>
    
                {/* Password Field */}
                <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-foreground/80">
                  Password
                </Label>
                <Button 
                  variant="link" 
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="px-0 text-xs font-normal text-foreground/60 hover:text-foreground h-auto py-0 tracking-tight transition-colors"
                >
                  Forgot password?
                </Button>
              </div>
              
              {/* 💡 Password Input Container Wrapper */}
              <div className="relative flex items-center">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 w-full bg-transparent border-border rounded-md pl-3 pr-10 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
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
              </CardContent>
    
              <CardFooter className="flex flex-col space-y-4 pt-4 pb-6">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-md text-sm transition-colors shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
                
                <div className="text-center text-xs text-foreground/50 font-normal">
                  Don&apos;t have an account?{" "}
                  <Button 
                    variant="link" 
                    type="button"
                    onClick={() => router.push("/register")}
                    className="p-0 text-xs text-foreground font-semibold h-auto py-0 hover:underline"
                  >
                    Sign up
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      );
}