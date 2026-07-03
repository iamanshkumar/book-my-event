"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Ticket, LogOut, Compass, Calendar, Sparkles, BarChart3, PlusCircle, ShieldCheck, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function OrganizerLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          
          // Redirect non-organizer profiles
          if (data.user.role !== "ORGANIZER" && data.user.role !== "ADMIN") {
            toast.error("Access denied", {
              description: "This portal is restricted to valid organizer accounts."
            });
            router.push("/dashboard");
            return;
          }
          
          setUser(data.user);
        } else {
          router.push("/login?redirect=/organizer/dashboard");
        }
      } catch (e) {
        router.push("/login?redirect=/organizer/dashboard");
      }
    }
    loadProfile();
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
    <div className="h-screen w-full flex bg-background text-foreground transition-colors duration-200 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-72 border-r border-border bg-card hidden md:flex flex-col justify-between p-5 select-none shrink-0 h-full">
        <div className="space-y-7">
          {/* Header Branding */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="bg-primary/10 text-primary p-2 rounded-lg border border-primary/20 shadow-inner">
              <ShieldCheck className="h-4.5 w-4.5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-sm bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">BookMyEvent</span>
              <p className="text-[9px] text-foreground/45 uppercase tracking-widest font-bold mt-0.5">Organizer Workspace</p>
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
              <p className="px-2 text-[9px] uppercase font-bold tracking-widest text-foreground/35 mb-2">Analytics & Control</p>
              <div className="space-y-1">
                <Button 
                  variant={pathname === "/organizer/dashboard" ? "secondary" : "ghost"} 
                  className={`w-full justify-start gap-3 h-9.5 text-xs rounded-lg cursor-pointer border border-transparent transition-all ${
                    pathname === "/organizer/dashboard" 
                      ? "bg-primary/10 text-primary border-primary/15 font-semibold" 
                      : "text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground font-light"
                  }`} 
                  onClick={() => router.push("/organizer/dashboard")}
                >
                  <BarChart3 className={`h-4 w-4 ${pathname === "/organizer/dashboard" ? "text-primary" : "text-foreground/40"}`} />
                  Metrics Dashboard
                </Button>

                <Button 
                  variant={pathname === "/organizer/events" ? "secondary" : "ghost"} 
                  className={`w-full justify-start gap-3 h-9.5 text-xs rounded-lg cursor-pointer border border-transparent transition-all ${
                    pathname === "/organizer/events" 
                      ? "bg-primary/10 text-primary border-primary/15 font-semibold" 
                      : "text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground font-light"
                  }`} 
                  onClick={() => router.push("/organizer/events")}
                >
                  <Layers className={`h-4 w-4 ${pathname === "/organizer/events" ? "text-primary" : "text-foreground/40"}`} />
                  Event Catalog
                </Button>

                <Button 
                  variant={pathname === "/organizer/events/create" ? "secondary" : "ghost"} 
                  className={`w-full justify-start gap-3 h-9.5 text-xs rounded-lg cursor-pointer border border-transparent transition-all ${
                    pathname === "/organizer/events/create" 
                      ? "bg-primary/10 text-primary border-primary/15 font-semibold" 
                      : "text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground font-light"
                  }`} 
                  onClick={() => router.push("/organizer/events/create")}
                >
                  <PlusCircle className={`h-4 w-4 ${pathname === "/organizer/events/create" ? "text-primary" : "text-foreground/40"}`} />
                  Schedule New Event
                </Button>
              </div>
            </div>

            <div>
              <p className="px-2 text-[9px] uppercase font-bold tracking-widest text-foreground/35 mb-2">Audit & Reservations</p>
              <Button 
                variant={pathname === "/organizer/bookings" ? "secondary" : "ghost"} 
                className={`w-full justify-start gap-3 h-9.5 text-xs rounded-lg cursor-pointer border border-transparent transition-all ${
                  pathname === "/organizer/bookings" 
                    ? "bg-primary/10 text-primary border-primary/15 font-semibold" 
                    : "text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground font-light"
                }`} 
                onClick={() => router.push("/organizer/bookings")}
              >
                <Ticket className={`h-4 w-4 ${pathname === "/organizer/bookings" ? "text-primary" : "text-foreground/40"}`} />
                Bookings
              </Button>
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
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 select-none shrink-0">
          <h1 className="text-sm font-medium tracking-tight text-foreground/75 md:block hidden">Organizer Workspace</h1>
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
