import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    console.log("[v0] Upload API called")

    // Get filename from query params (as per Vercel Blob documentation)
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get("filename")

    if (!filename) {
      console.error("[v0] No filename provided in query params")
      return NextResponse.json({ error: "Filename is required in query params" }, { status: 400 })
    }

    // Validate file type from filename extension
    const fileExtension = filename.split(".").pop()?.toLowerCase()
    const validExtensions = ["jpg", "jpeg", "png", "webp", "gif"]
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      console.error("[v0] Invalid file extension:", fileExtension)
      return NextResponse.json({ error: "Invalid file type. Please upload JPG, PNG, WEBP, or GIF" }, { status: 400 })
    }

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const uniqueFilename = `products/${timestamp}-${randomString}.${fileExtension}`

    console.log("[v0] Uploading to blob storage:", uniqueFilename)

    // For App Router Route Handlers, pass request.body directly (as per Vercel Blob docs)
    // request.body is a ReadableStream of the file
    const blob = await put(uniqueFilename, request.body, {
      access: "public",
    })

    console.log("[v0] Upload successful:", blob.url)

    return NextResponse.json(blob)
  } catch (error) {
    console.error("[v0] Upload failed:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 })
  }
}
