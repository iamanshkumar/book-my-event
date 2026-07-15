"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Ticket, User, LogOut, Compass, KeyRound, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AttendeeLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [websiteTitle, setWebsiteTitle] = useState("BookMyEvent");
  const [websiteLogo, setWebsiteLogo] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (e) {
      }
    }
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.websiteTitle) setWebsiteTitle(data.websiteTitle);
          setWebsiteLogo(data.websiteLogo || null);
          setIsDemoMode(data.isDemoMode === "1");
        }
      } catch (e) {
      }
    }
    loadProfile();
    loadSettings();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST"
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
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background text-foreground transition-colors duration-200 overflow-hidden">
      {isDemoMode && (
        <div className="w-full bg-destructive/10 text-destructive text-xs font-semibold py-2.5 px-4 text-center border-b border-destructive/15 select-none shrink-0 animate-fade-in">
          This is a demo store. No orders will be Honoured.
        </div>
      )}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-72 border-r border-border bg-card hidden md:flex flex-col justify-between p-5 select-none shrink-0 h-full">
          <div className="space-y-7">
            <div className="flex items-center gap-2.5 px-2">
              {websiteLogo && (
                <img src={websiteLogo} alt={websiteTitle} className="h-8 w-8 object-contain rounded-md" />
              )}
              <div>
                <span className="font-extrabold tracking-tight text-sm bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                  {websiteTitle}
                </span>
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
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 select-none shrink-0">
            {/* Mobile Branding Logo */}
            <div className="flex items-center gap-2 md:hidden cursor-pointer" onClick={() => router.push("/")}>
              {websiteLogo && (
                <img src={websiteLogo} alt={websiteTitle} className="h-6 w-6 object-contain rounded-md" />
              )}
              <span className="font-extrabold tracking-tight text-xs bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                {websiteTitle}
              </span>
            </div>

            <h1 className="text-sm font-medium tracking-tight text-foreground/75 md:block hidden">Attendee Workspace</h1>
            <div className="flex items-center gap-4 ml-auto">
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden border-t border-border bg-card/95 backdrop-blur-md h-16 w-full flex items-center justify-around px-2 shrink-0 z-40 select-none">
        <button
          onClick={() => router.push("/")}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all cursor-pointer ${
            pathname === "/" ? "text-primary" : "text-foreground/50"
          }`}
        >
          <Compass className="h-5 w-5" />
          <span>Discover</span>
        </button>
        <button
          onClick={() => router.push("/dashboard")}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all cursor-pointer ${
            pathname === "/dashboard" ? "text-primary" : "text-foreground/50"
          }`}
        >
          <Ticket className="h-5 w-5" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => router.push("/dashboard/profile")}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all cursor-pointer ${
            pathname === "/dashboard/profile" || pathname === "/dashboard/change-password" ? "text-primary" : "text-foreground/50"
          }`}
        >
          <User className="h-5 w-5" />
          <span>Profile</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 text-[10px] font-medium text-destructive transition-all cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
}
