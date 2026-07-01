"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 , Eye , EyeOff} from "lucide-react";
import {toast} from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function RegisterPage(){
    const router = useRouter();
    const [name , setName] = useState("");
    const [email , setEmail] = useState("");
    const [password , setPassword] = useState("");
    const [role , setRole] = useState("CUSTOMER");
    const [loading , setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async(e : React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        setLoading(true);

        try{
            const response = await fetch("/api/auth/register" , {
                method : "POST",
                headers : {"Content-Type" : "application/json"},
                body : JSON.stringify({ name, email, password, role })
            });

            const data = await response.json();

            if(!response.json()){
                throw new Error(data.error || "Registration failed. Please try again.");
            }

            toast.success("Account created successfully!", {
                description: "Redirecting you to the login panel...",
            });

            setTimeout(() => {
                router.push("/login");
            }, 1600);
        }catch(err : any){
            toast.error("Registration Failed", {
                description: err.message,
            });
        }finally{
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
            <div className="absolute top-6 right-6">
                            <ThemeToggle />
            </div>
          <Card className="w-full max-w-sm border border-border bg-card p-2 rounded-lg shadow-sm">
            <CardHeader className="space-y-1.5 text-center pt-6">
              <CardTitle className="text-2xl font-semibold tracking-tight text-card-foreground">
                Create an Account
              </CardTitle>
              <CardDescription className="text-sm text-foreground/60">
                Enter your details below to get started
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4 pt-4">
                {/* Full Name Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium text-foreground/80">
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
                  <Label htmlFor="email" className="text-xs font-medium text-foreground/80">
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
              <Label htmlFor="password" className="text-xs font-medium text-foreground/80">
                Password
              </Label>
              {/* 💡 Password Input Container Wrapper */}
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
    
                {/* Dynamic Role Dropdown Selector */}
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-xs font-medium text-foreground/80">
                    Join as a
                  </Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="w-full h-10 bg-transparent border-border text-sm text-card-foreground focus:ring-1 focus:ring-ring">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card text-card-foreground">
                      <SelectItem value="CUSTOMER">Attendee (Book Tickets)</SelectItem>
                      <SelectItem value="ORGANIZER">Organizer (Host Events)</SelectItem>
                    </SelectContent>
                  </Select>
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
                      Creating account...
                    </>
                  ) : (
                    "Get Started"
                  )}
                </Button>
                
                <div className="text-center text-xs text-foreground/50 font-normal">
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
              </CardFooter>
            </form>
          </Card>
        </div>
    );
}