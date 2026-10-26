import { NextResponse } from "next/server";
import {
  getSession,
  permissions,
  isSupabaseConfigured,
  getLiveEditorialProfile,
} from "@/lib/auth";
import { contentRepository } from "@/lib/data";

async function verifyAdminSession(session: any): Promise<boolean> {
  if (isSupabaseConfigured() && session.token && !session.user.isSimulated) {
    const liveProfile = await getLiveEditorialProfile(session.user.id, session.token);
    const isAccountActive = liveProfile?.is_active === true;
    const isAccountApproved = !liveProfile?.approval_status || liveProfile.approval_status === "approved";

    if (!liveProfile || !isAccountActive || !isAccountApproved) {
      return false;
    }
    session.user.role = liveProfile.role;
    session.user.approvalStatus = liveProfile.approval_status || "approved";
  }
  return permissions.isAdministrator(session.user.role);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const isAuthorized = await verifyAdminSession(session);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Permission Denied: Only Administrators can view and manage user accounts." },
        { status: 403 }
      );
    }

    const profiles = await contentRepository.getEditorialProfiles(session.token);

    return NextResponse.json({
      success: true,
      users: profiles,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load user accounts.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const isAuthorized = await verifyAdminSession(session);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Permission Denied: Only Administrators can approve or reject applications." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, userId, role, assignedSections } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: "Missing required parameters: userId and action are required." },
        { status: 400 }
      );
    }

    if (action === "approve") {
      const assignedRole = role || "section_writer";
      await contentRepository.updateUserProfile(
        userId,
        {
          role: assignedRole,
          approvalStatus: "approved",
          assignedSections: assignedSections || [],
        },
        session.token
      );

      return NextResponse.json({
        success: true,
        message: `Application approved. Assigned role: ${assignedRole}.`,
      });
    }

    if (action === "reject") {
      await contentRepository.updateUserProfile(
        userId,
        {
          approvalStatus: "rejected",
        },
        session.token
      );

      return NextResponse.json({
        success: true,
        message: "Application rejected.",
      });
    }

    return NextResponse.json(
      { error: `Invalid action: "${action}".` },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process user action.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const isAuthorized = await verifyAdminSession(session);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Permission Denied: Only Administrators can update user roles and permissions." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role, approvalStatus, assignedSections } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    // Safety safeguard: Never allow demoting or locking out the existing root admin
    if (userId === session.user.id && (approvalStatus === "suspended" || approvalStatus === "rejected")) {
      return NextResponse.json(
        { error: "Safety Guard: You cannot suspend or reject your own active Administrator account." },
        { status: 400 }
      );
    }

    await contentRepository.updateUserProfile(
      userId,
      {
        ...(role ? { role } : {}),
        ...(approvalStatus ? { approvalStatus } : {}),
        ...(assignedSections ? { assignedSections } : {}),
      },
      session.token
    );

    return NextResponse.json({
      success: true,
      message: "User account updated successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update user account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
