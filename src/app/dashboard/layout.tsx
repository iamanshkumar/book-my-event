"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Ticket, User, LogOut, Compass, KeyRound, Calendar, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AttendeeLayout({children} : {children : React.ReactNode}){
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
      async function loadProfile() {
        try {
          const res = await fetch("/api/auth/me");
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          }
        } catch (e) {
          // Ignore
        }
      }
      loadProfile();
    }, []);

    const handleLogout = async()=>{
        try {
            const response = await fetch("/api/auth/logout",{
                method : "POST"
            });
            const data = await response.json();
            toast.success(data.message)
            
            setTimeout(() => {
                router.push("/login");
            }, 1600);
    
          } catch (err: any) {
            toast.error("Error in logging out", {
              description: err.message,
            });
        }
    }

    return (
        <div className="min-h-screen w-full flex bg-background text-foreground transition-colors duration-200">
          {/* Sidebar Navigation */}
          <aside className="w-66 border-r border-border bg-card hidden md:flex flex-col justify-between p-5 select-none shrink-0">
            <div className="space-y-7">
              {/* Header Branding */}
              <div className="flex items-center gap-2.5 px-2">
                <div className="bg-primary/10 text-primary p-2 rounded-lg border border-primary/20 shadow-inner">
                  <Calendar className="h-4.5 w-4.5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="font-extrabold tracking-tight text-sm bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">BookMyEvent</span>
                  <p className="text-[9px] text-foreground/45 uppercase tracking-widest font-bold mt-0.5">Attendee Hub</p>
                </div>
              </div>
    
              {/* Sidebar Menu Grouping */}
              <div className="space-y-6">
                <div>
                  <p className="px-2 text-[9px] uppercase font-bold tracking-widest text-foreground/35 mb-2">Discovery</p>
                  <Button 
                    variant={pathname === "/" ? "secondary" : "ghost"} 
                    className={`w-full justify-start gap-3 h-9.5 text-xs rounded-lg cursor-pointer border border-transparent transition-all ${
                      pathname === "/" 
                        ? "bg-primary/10 text-primary border-primary/15 font-semibold" 
                        : "text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground font-light"
                    }`} 
                    onClick={() => router.push("/")}
                  >
                    <Compass className={`h-4 w-4 ${pathname === "/" ? "text-primary" : "text-foreground/40"}`} />
                    Discover Events
                  </Button>
                </div>

                <div>
                  <p className="px-2 text-[9px] uppercase font-bold tracking-widest text-foreground/35 mb-2">Private Portal</p>
                  <Button 
                    variant={pathname === "/dashboard" ? "secondary" : "ghost"} 
                    className={`w-full justify-start gap-3 h-9.5 text-xs rounded-lg cursor-pointer border border-transparent transition-all ${
                      pathname === "/dashboard" 
                        ? "bg-primary/10 text-primary border-primary/15 font-semibold" 
                        : "text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground font-light"
                    }`} 
                    onClick={() => router.push("/dashboard")}
                  >
                    <Ticket className={`h-4 w-4 ${pathname === "/dashboard" ? "text-primary" : "text-foreground/40"}`} />
                    My Dashboard
                  </Button>
                </div>

                <div>
                  <p className="px-2 text-[9px] uppercase font-bold tracking-widest text-foreground/35 mb-2">Security & Identity</p>
                  <div className="space-y-1">
                    <Button 
                      variant={pathname === "/dashboard/profile" ? "secondary" : "ghost"} 
                      className={`w-full justify-start gap-3 h-9.5 text-xs rounded-lg cursor-pointer border border-transparent transition-all ${
                        pathname === "/dashboard/profile" 
                          ? "bg-primary/10 text-primary border-primary/15 font-semibold" 
                          : "text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground font-light"
                      }`} 
                      onClick={() => router.push("/dashboard/profile")}
                    >
                      <User className={`h-4 w-4 ${pathname === "/dashboard/profile" ? "text-primary" : "text-foreground/40"}`} />
                      Profile Settings
                    </Button>
                    <Button 
                      variant={pathname === "/dashboard/change-password" ? "secondary" : "ghost"} 
                      className={`w-full justify-start gap-3 h-9.5 text-xs rounded-lg cursor-pointer border border-transparent transition-all ${
                        pathname === "/dashboard/change-password" 
                          ? "bg-primary/10 text-primary border-primary/15 font-semibold" 
                          : "text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground font-light"
                      }`} 
                      onClick={() => router.push("/dashboard/change-password")}
                    >
                      <KeyRound className={`h-4 w-4 ${pathname === "/dashboard/change-password" ? "text-primary" : "text-foreground/40"}`} />
                      Change Password
                    </Button>
                  </div>
                </div>
              </div>
            </div>
    
            <div className="space-y-4">
              {/* User Quick Profile Card */}
              {user && (
                <div className="flex items-center gap-3 p-3 bg-foreground/[0.02] border border-border/50 rounded-xl relative overflow-hidden group">
                  <div className="h-8.5 w-8.5 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xs border border-primary/15 shrink-0">
                    {user.name?.charAt(0).toUpperCase() || "C"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate leading-none">{user.name}</p>
                    <p className="text-[10px] text-foreground/45 truncate mt-1.5 font-light">{user.email}</p>
                  </div>
                  <div className="absolute right-0.5 top-0.5 bg-primary/15 p-0.5 px-1 rounded-bl-lg">
                    <span className="text-[7px] text-primary uppercase font-bold tracking-widest">Client</span>
                  </div>
                </div>
              )}

              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 h-9.5 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer border border-transparent transition-all" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </aside>
    
          {/* Main Content Workspace Canvas */}
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 select-none shrink-0">
              <h1 className="text-sm font-medium tracking-tight text-foreground/75 md:block hidden">Attendee Workspace</h1>
              <div className="flex items-center gap-4 ml-auto">
                <ThemeToggle />
              </div>
            </header>
    
            <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
    );
}
