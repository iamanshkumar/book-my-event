"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut, Compass, BarChart3, Users, Calendar, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();

          // Redirect non-admin profiles
          if (data.user.role !== "ADMIN") {
            toast.error("Access denied", {
              description: "This portal is restricted to valid administrator accounts."
            });
            router.push("/dashboard");
            return;
          }

          setUser(data.user);
        } else {
          router.push("/login?redirect=/admin/dashboard");
        }
      } catch (e) {
        router.push("/login?redirect=/admin/dashboard");
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
  }

  return (
    <div className="h-screen w-full flex bg-background text-foreground transition-colors duration-200 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-72 border-r border-border bg-card hidden md:flex flex-col justify-between p-5 select-none shrink-0 h-full">
        <div className="space-y-7">
          {/* Header Branding */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="bg-primary/10 text-primary p-2 rounded-lg border border-primary/20 shadow-inner">
              <ShieldAlert className="h-4.5 w-4.5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-sm bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">BookMyEvent</span>
              <p className="text-[9px] text-foreground/45 uppercase tracking-widest font-bold mt-0.5">Control Panel</p>
            </div>
          </div>

          {/* Sidebar Menu Grouping */}
          <div className="space-y-6">
            <div>
              <p className="px-2 text-[9px] uppercase font-bold tracking-widest text-foreground/35 mb-2">Discovery</p>
              <Button
                variant={pathname === "/" ? "secondary" : "ghost"}
                className={`w-full justify-start gap-3 h-9.5 text-xs rounded-lg cursor-pointer border border-transparent transition-all ${pathname === "/"
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
              <p className="px-2 text-[9px] uppercase font-bold tracking-widest text-foreground/35 mb-2">System Analytics</p>
              <div className="space-y-1">
                <Button
                  variant={pathname === "/admin/dashboard" ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-9.5 text-xs rounded-lg cursor-pointer border border-transparent transition-all ${pathname === "/admin/dashboard"
                      ? "bg-primary/10 text-primary border-primary/15 font-semibold"
                      : "text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground font-light"
                    }`}
                  onClick={() => router.push("/admin/dashboard")}
                >
                  <BarChart3 className={`h-4 w-4 ${pathname === "/admin/dashboard" ? "text-primary" : "text-foreground/40"}`} />
                  Admin Dashboard
                </Button>
              </div>
            </div>

            <div>
              <p className="px-2 text-[9px] uppercase font-bold tracking-widest text-foreground/35 mb-2">Moderation Logs</p>
              <div className="space-y-1">
                <Button
                  variant={pathname === "/admin/users" ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-9.5 text-xs rounded-lg cursor-pointer border border-transparent transition-all ${pathname === "/admin/users"
                      ? "bg-primary/10 text-primary border-primary/15 font-semibold"
                      : "text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground font-light"
                    }`}
                  onClick={() => router.push("/admin/users")}
                >
                  <Users className={`h-4 w-4 ${pathname === "/admin/users" ? "text-primary" : "text-foreground/40"}`} />
                  User Management
                </Button>

                <Button
                  variant={pathname === "/admin/events" ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-9.5 text-xs rounded-lg cursor-pointer border border-transparent transition-all ${pathname === "/admin/events"
                      ? "bg-primary/10 text-primary border-primary/15 font-semibold"
                      : "text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground font-light"
                    }`}
                  onClick={() => router.push("/admin/events")}
                >
                  <Calendar className={`h-4 w-4 ${pathname === "/admin/events" ? "text-primary" : "text-foreground/40"}`} />
                  Event Moderation
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
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 select-none shrink-0">
          <h1 className="text-sm font-medium tracking-tight text-foreground/75 md:block hidden">Administration Workspace</h1>
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
