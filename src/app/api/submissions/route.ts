import { NextResponse } from "next/server";
import { contentRepository } from "@/lib/data";
import { getSession, permissions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let studentName = "";
    let rollNumber = "";
    let email = "";
    let title = "";
    let content = "";
    let categoryId = "";
    let pdfUrl: string | undefined = undefined;
    let pdfFilename: string | undefined = undefined;
    let displayAuthorName = true;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      studentName = (formData.get("studentName") as string) || "";
      rollNumber = (formData.get("rollNumber") as string) || "";
      email = (formData.get("email") as string) || "";
      title = (formData.get("title") as string) || "";
      content = (formData.get("content") as string) || "";
      categoryId = (formData.get("categoryId") as string) || "";
      displayAuthorName = formData.get("displayAuthorName") !== "false";

      const file = formData.get("file") as File | null;
      if (file && file.size > 0) {
        // Enforce PDF only and 10MB limit
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
          return NextResponse.json(
            { error: "Invalid file type. Only PDF documents are accepted." },
            { status: 400 }
          );
        }
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: "File exceeds maximum size of 10MB." },
            { status: 400 }
          );
        }

        // Upload to Supabase Storage bucket 'submissions'
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (supabaseUrl && anonKey) {
          const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const uniquePath = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${sanitizedFilename}`;
          const buffer = await file.arrayBuffer();

          const uploadRes = await fetch(
            `${supabaseUrl}/storage/v1/object/submissions/${uniquePath}`,
            {
              method: "POST",
              headers: {
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
                "Content-Type": "application/pdf",
              },
              body: buffer,
            }
          );

          if (uploadRes.ok) {
            pdfUrl = `${supabaseUrl}/storage/v1/object/public/submissions/${uniquePath}`;
            pdfFilename = file.name;
          } else {
            console.error("Storage upload error:", await uploadRes.text());
          }
        }
      }
    } else {
      const body = await request.json();
      studentName = body.studentName || "";
      rollNumber = body.rollNumber || "";
      email = body.email || "";
      title = body.title || "";
      content = body.content || "";
      categoryId = body.categoryId || "";
      pdfUrl = body.pdfUrl;
      pdfFilename = body.pdfFilename;
      displayAuthorName = body.displayAuthorName !== false;
    }

    // Validation: Title required
    if (!title.trim()) {
      return NextResponse.json(
        { error: "Article headline/title is required." },
        { status: 400 }
      );
    }

    // Validation: At least content or PDF
    if (!content.trim() && !pdfUrl) {
      return NextResponse.json(
        { error: "Please provide either article content or upload a PDF document." },
        { status: 400 }
      );
    }

    // Create submission in database
    const submission = await contentRepository.createStudentSubmission({
      studentName: studentName.trim() || undefined,
      rollNumber: rollNumber.trim() || undefined,
      email: email.trim() || undefined,
      title: title.trim(),
      content: content.trim() || undefined,
      categoryId: categoryId.trim() || undefined,
      pdfUrl,
      pdfFilename,
      displayAuthorName,
    });

    // Send confirmation email if email supplied
    if (email.trim()) {
      try {
        await contentRepository.recordEmailLog({
          recipientEmail: email.trim(),
          subject: `Submission Received — The Executive Brief [${submission.referenceNumber}]`,
          referenceNumber: submission.referenceNumber,
          status: "sent",
          payload: {
            title: submission.title,
            studentName: submission.studentName || "Contributor",
            referenceNumber: submission.referenceNumber,
            date: new Date().toISOString(),
          },
        });
      } catch (emailErr) {
        console.error("Email notification log warning:", emailErr);
      }
    }

    // Record system audit log
    try {
      await contentRepository.recordSystemAuditLog({
        action: "student_submission_created",
        resourceType: "submission",
        resourceId: submission.id,
        resourceTitle: submission.title,
        details: {
          referenceNumber: submission.referenceNumber,
          hasEmail: Boolean(email.trim()),
          hasPdf: Boolean(pdfUrl),
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      referenceNumber: submission.referenceNumber,
      submission,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process submission.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Editorial or Admin privileges required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const submissions = await contentRepository.getStudentSubmissions(status, session.token);

    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch submissions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Editorial or Admin privileges required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Submission ID is required." }, { status: 400 });
    }

    // Check if converting to article draft
    if (body.action === "convert_to_draft") {
      const article = await contentRepository.convertSubmissionToDraft(
        body.id,
        session.user.id,
        session.token
      );
      return NextResponse.json({ success: true, article });
    }

    const updated = await contentRepository.updateStudentSubmission(
      body.id,
      body.updates || body,
      session.token
    );

    await contentRepository.recordSystemAuditLog({
      actorId: session.user.id,
      actorName: session.user.fullName,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      action: `submission_${body.status || "updated"}`,
      resourceType: "submission",
      resourceId: body.id,
      resourceTitle: updated.title,
      details: { updates: body },
    }, session.token);

    return NextResponse.json({ success: true, submission: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update submission.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Editorial or Admin privileges required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Submission ID is required." }, { status: 400 });
    }

    const success = await contentRepository.deleteStudentSubmission(id, session.token);

    await contentRepository.recordSystemAuditLog({
      actorId: session.user.id,
      actorName: session.user.fullName,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      action: "submission_deleted",
      resourceType: "submission",
      resourceId: id,
    }, session.token);

    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete submission.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
