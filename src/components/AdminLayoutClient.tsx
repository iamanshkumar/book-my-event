"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  LogOut,
  Compass,
  BarChart3,
  Users,
  Calendar,
  ShieldAlert,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [websiteTitle, setWebsiteTitle] = useState("BookMyEvent");
  const [websiteLogo, setWebsiteLogo] = useState<string | null>(null);
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
              description:
                "This portal is restricted to valid administrator accounts.",
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
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.websiteTitle) setWebsiteTitle(data.websiteTitle);
          setWebsiteLogo(data.websiteLogo || null);
        }
      } catch (e) {
        // ignore
      }
    }
    loadProfile();
    loadSettings();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      const data = await response.json();
      toast.success(data.message);

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
    <div className="h-screen w-full flex flex-col md:flex-row bg-background text-foreground transition-colors duration-200 overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
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
                <p className="text-[9px] text-foreground/45 uppercase tracking-widest font-bold mt-0.5">
                  Control Panel
                </p>
              </div>
            </div>

            {/* Sidebar Menu Grouping */}
            <div className="space-y-6">
              <div>
                <p className="px-2 text-[9px] uppercase font-bold tracking-widest text-foreground/35 mb-2">
                  Discovery
                </p>
                <Button
                  variant={pathname === "/" ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-9.5 text-xs rounded-lg cursor-pointer border border-transparent transition-all ${
                    pathname === "/"
                      ? "bg-primary/10 text-primary border-primary/15 font-semibold"
                      : "text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground font-light"
                  }`}
                  onClick={() => router.push("/")}
                >
                  <Compass
                    className={`h-4 w-4 ${pathname === "/" ? "text-primary" : "text-foreground/40"}`}
                  />
                  Discover Events
                </Button>
              </div>

              <div>
                <p className="px-2 text-[9px] uppercase font-bold tracking-widest text-foreground/35 mb-2">
                  System Analytics
                </p>
                <div className="space-y-1">
                  <Button
                    variant={
                      pathname === "/admin/dashboard" ? "secondary" : "ghost"
                    }
                    className={`w-full justify-start gap-3 h-9.5 text-xs rounded-lg cursor-pointer border border-transparent transition-all ${
                      pathname === "/admin/dashboard"
                        ? "bg-primary/10 text-primary border-primary/15 font-semibold"
                        : "text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground font-light"
                    }`}
                    onClick={() => router.push("/admin/dashboard")}
                  >
                    <BarChart3
                      className={`h-4 w-4 ${pathname === "/admin/dashboard" ? "text-primary" : "text-foreground/40"}`}
                    />
                    Admin Dashboard
                  </Button>
                </div>
              </div>

              <div>
                <p className="px-2 text-[9px] uppercase font-bold tracking-widest text-foreground/35 mb-2">
                  Moderation Logs
                </p>
                <div className="space-y-1">
                  <Button
                    variant={pathname === "/admin/users" ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 h-9.5 text-xs rounded-lg cursor-pointer border border-transparent transition-all ${
                      pathname === "/admin/users"
                        ? "bg-primary/10 text-primary border-primary/15 font-semibold"
                        : "text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground font-light"
                    }`}
                    onClick={() => router.push("/admin/users")}
                  >
                    <Users
                      className={`h-4 w-4 ${pathname === "/admin/users" ? "text-primary" : "text-foreground/40"}`}
                    />
                    User Management
                  </Button>

                  <Button
                    variant={pathname === "/admin/events" ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 h-9.5 text-xs rounded-lg cursor-pointer border border-transparent transition-all ${
                      pathname === "/admin/events"
                        ? "bg-primary/10 text-primary border-primary/15 font-semibold"
                        : "text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground font-light"
                    }`}
                    onClick={() => router.push("/admin/events")}
                  >
                    <Calendar
                      className={`h-4 w-4 ${pathname === "/admin/events" ? "text-primary" : "text-foreground/40"}`}
                    />
                    Event Moderation
                  </Button>
                </div>
              </div>
              <div>
                <p className="px-2 text-[9px] uppercase font-bold tracking-widest text-foreground/35 mb-2">
                  Configurations
                </p>
                <div className="space-y-1">
                  <Button
                    variant={
                      pathname === "/admin/settings" ? "secondary" : "ghost"
                    }
                    className={`w-full justify-start gap-3 h-9.5 text-xs rounded-lg cursor-pointer border border-transparent transition-all ${
                      pathname === "/admin/settings"
                        ? "bg-primary/10 text-primary border-primary/15 font-semibold"
                        : "text-foreground/60 hover:bg-foreground/[0.02] hover:text-foreground font-light"
                    }`}
                    onClick={() => router.push("/admin/settings")}
                  >
                    <Settings
                      className={`h-4 w-4 ${pathname === "/admin/settings" ? "text-primary" : "text-foreground/40"}`}
                    />
                    Website Settings
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

            <h1 className="text-sm font-medium tracking-tight text-foreground/75 md:block hidden">
              Administration Workspace
            </h1>
            
            <div className="flex items-center gap-2 ml-auto">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="md:hidden text-destructive hover:bg-destructive/10 h-8 w-8 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
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
          onClick={() => router.push("/admin/dashboard")}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all cursor-pointer ${
            pathname === "/admin/dashboard" ? "text-primary" : "text-foreground/50"
          }`}
        >
          <BarChart3 className="h-5 w-5" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => router.push("/admin/users")}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all cursor-pointer ${
            pathname === "/admin/users" ? "text-primary" : "text-foreground/50"
          }`}
        >
          <Users className="h-5 w-5" />
          <span>Users</span>
        </button>
        <button
          onClick={() => router.push("/admin/events")}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all cursor-pointer ${
            pathname === "/admin/events" ? "text-primary" : "text-foreground/50"
          }`}
        >
          <Calendar className="h-5 w-5" />
          <span>Events</span>
        </button>
        <button
          onClick={() => router.push("/admin/settings")}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all cursor-pointer ${
            pathname === "/admin/settings" ? "text-primary" : "text-foreground/50"
          }`}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}
