import { getMaintenanceSettings } from "@/backend/lib/settings";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const settings = await getMaintenanceSettings();
        return NextResponse.json({
            maintenanceModeEnabled: settings.maintenanceModeEnabled,
            maintenanceContent: settings.maintenanceContent,
            maintenanceAllowedIps: settings.maintenanceAllowedIps
        }, {
            status: 200,
            headers: {
                // Ensure this API response isn't cached by middleware fetches
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
            }
        });
    } catch (err: any) {
        return NextResponse.json({
            error: err.message || "Failed to retrieve maintenance status."
        }, {
            status: 500
        });
    }
}
