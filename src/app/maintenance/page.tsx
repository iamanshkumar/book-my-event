import React from "react";
import { getMaintenanceSettings } from "@/backend/lib/settings";
import { Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const settings = await getMaintenanceSettings();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] text-[#EDEDED] font-sans p-4 select-none">
      <div className="max-w-[500px] w-full bg-[#141414] border border-[#262626] rounded-2xl p-8 md:p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.6)]">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#D97757]/10 border border-[#D97757]/20 text-[#D97757] mb-6">
          <Wrench className="w-7 h-7" />
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight text-[#EDEDED] mb-4">
          We'll be back soon!
        </h1>
        
        <p className="text-sm text-[#A3A3A3] leading-relaxed font-light whitespace-pre-wrap">
          {settings.maintenanceContent || "The website is currently undergoing scheduled maintenance. Please check back shortly."}
        </p>
        
        <div className="inline-block bg-[#D97757]/10 border border-[#D97757]/20 text-[#D97757] text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full mt-6">
          System Offline
        </div>
      </div>
    </div>
  );
}
