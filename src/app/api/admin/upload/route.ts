import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}-${originalName}`;

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase config:", { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseKey 
      });
      return NextResponse.json(
        { 
          error: "Supabase configuration missing. Please check environment variables.",
          details: "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set"
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("drawings")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      
      // Provide helpful error messages
      if (error.message.includes("not found") || error.message.includes("Bucket")) {
        return NextResponse.json(
          { 
            error: "Storage bucket 'drawings' not found",
            details: "Please create a public bucket named 'drawings' in Supabase Storage",
            supabaseError: error.message
          },
          { status: 500 }
        );
      }
      
      if (error.message.includes("policy")) {
        return NextResponse.json(
          { 
            error: "Storage access denied",
            details: "Please check bucket policies in Supabase Storage. Bucket must be public or have appropriate RLS policies.",
            supabaseError: error.message
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          error: `Upload failed: ${error.message}`,
          details: error
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("drawings")
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      path: urlData.publicUrl,
      filename: filename,
      storage: "supabase",
    });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { 
        error: "Failed to upload file",
        details: error.message || error
      },
      { status: 500 }
    );
  }
}
