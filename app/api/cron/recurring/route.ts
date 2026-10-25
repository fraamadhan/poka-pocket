import { NextResponse } from "next/server";
import { processPendingRecurringRules } from "@/app/actions/recurring";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  // Verify secret authorization header sent by Vercel Cron
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing cron secret." },
      { status: 401 }
    );
  }

  const result = await processPendingRecurringRules();

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    processedCount: result.processedCount,
    details: result.details,
  });
}
