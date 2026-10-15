import { NextResponse } from "next/server";
import { getSession, isSupabaseConfigured } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    user: session?.user || null,
    isConfigured: isSupabaseConfigured(),
  });
}
