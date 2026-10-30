import { NextResponse } from "next/server";
import { getSession, permissions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        files: [
          {
            name: "hyderabad-skyline.jpg",
            url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85",
            size: 245000,
            type: "image/jpeg",
            createdAt: new Date().toISOString(),
          },
          {
            name: "osmania-arts-college.jpg",
            url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80",
            size: 312000,
            type: "image/jpeg",
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    // List objects from 'media' bucket via Supabase Storage REST endpoint
    const res = await fetch(`${supabaseUrl}/storage/v1/object/list/media`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${session.token || anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: `Storage list failed: ${errorText}` }, { status: res.status });
    }

    const objects: Array<{ name: string; id: string; updated_at: string; created_at: string; metadata: any }> = await res.json();

    const files = objects.map((obj) => ({
      name: obj.name,
      id: obj.id,
      url: `${supabaseUrl}/storage/v1/object/public/media/${obj.name}`,
      size: obj.metadata?.size || 0,
      type: obj.metadata?.mimetype || "application/octet-stream",
      createdAt: obj.created_at || obj.updated_at,
    }));

    return NextResponse.json({ files });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load media assets.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "general"; // 'covers' | 'authors' | 'articles' | 'general'

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 20MB limit." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: "Supabase storage is not configured." }, { status: 500 });
    }

    const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const path = `${category}/${Date.now()}-${sanitized}`;
    const buffer = await file.arrayBuffer();

    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/media/${path}`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${session.token || anonKey}`,
        "Content-Type": file.type || "application/octet-stream",
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return NextResponse.json({ error: `Upload failed: ${errText}` }, { status: 500 });
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/media/${path}`;

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        path,
        url: publicUrl,
        size: file.size,
        type: file.type,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload media.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !permissions.isEditorial(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "File path is required." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && anonKey) {
      await fetch(`${supabaseUrl}/storage/v1/object/media`, {
        method: "DELETE",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${session.token || anonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefixes: [path] }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
