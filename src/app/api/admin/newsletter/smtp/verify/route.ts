import { NextResponse } from "next/server";
import { getSession, permissions } from "@/lib/auth";
import { verifySMTPConnection } from "@/lib/newsletter/smtpService";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const result = await verifySMTPConnection();
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "SMTP verification failed.";
    return NextResponse.json({ verified: false, message }, { status: 500 });
  }
}
