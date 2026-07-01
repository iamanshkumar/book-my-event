"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Ticket, User, LogOut, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AttendeeLayout({children} : {children : React.ReactNode}){
    const router = useRouter();

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
          <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col justify-between p-6">
            <div className="space-y-8">
              <div className="flex items-center gap-2 px-2">
                <span className="font-semibold tracking-tight text-lg">BookMyEvent</span>
              </div>
    
              <nav className="space-y-1">
                <Button variant="secondary" className="w-full justify-start gap-3 h-10 font-normal rounded-md" onClick={() => router.push("/dashboard")}>
                  <Compass className="h-4 w-4 text-foreground/70" />
                  Discover Events
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 h-10 font-normal hover:bg-foreground/5 rounded-md" onClick={() => router.push("/dashboard/tickets")}>
                  <Ticket className="h-4 w-4 text-foreground/60" />
                  My Tickets
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 h-10 font-normal hover:bg-foreground/5 rounded-md" onClick={() => router.push("/dashboard/profile")}>
                  <User className="h-4 w-4 text-foreground/60" />
                  Profile
                </Button>
              </nav>
            </div>
    
            <div>
              <Button variant="ghost" className="w-full justify-start gap-3 h-10 font-normal text-destructive hover:bg-destructive/10 rounded-md" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </aside>
    
          {/* Main Content Workspace Canvas */}
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
              <h1 className="text-sm font-medium tracking-tight text-foreground/70 md:block hidden">Attendee Workspace</h1>
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
