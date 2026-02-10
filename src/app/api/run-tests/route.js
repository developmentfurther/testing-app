import { NextResponse } from "next/server";
import { runAllTests } from "@/lib/test-runner";

export async function POST(req) {
  const secret = req.headers.get("x-cron-secret");

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const report = await runAllTests();

    return NextResponse.json({
      success: true,
      ...report,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: "Runner crashed",
        error: err?.message,
      },
      { status: 500 }
    );
  }
}
