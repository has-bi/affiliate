import { NextResponse } from "next/server";
import gcpStorage from "@/lib/gcp-storage";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit - increased for cloud storage)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to GCP Storage
    console.log(`[Upload] Uploading ${file.name} (${file.size} bytes) to GCP Storage`);
    const publicUrl = await gcpStorage.uploadFile(buffer, file.name, file.type);
    
    console.log(`[Upload] Successfully uploaded to: ${publicUrl}`);

    // Return the GCP public URL
    return NextResponse.json({
      url: publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
      storage: 'gcp'
    });

  } catch (error) {
    console.error("Error uploading image to GCP:", error);
    return NextResponse.json(
      { error: `Failed to upload image: ${error.message}` },
      { status: 500 }
    );
  }
}