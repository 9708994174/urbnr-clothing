"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, X } from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Footer } from "@/components/footer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

export default function UploadProductPage() {
  const [productName, setProductName] = useState("")
  const [productType, setProductType] = useState("")
  const [description, setDescription] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  /* ---------------- IMAGE HANDLING ---------------- */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setError(null)
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB")
      setImageFile(null)
      setImagePreview(null)
      return
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPG, PNG, WEBP, or GIF)")
      setImageFile(null)
      setImagePreview(null)
      return
    }

    // Validate image dimensions (optional - can be added if needed)
    const img = new Image()
    img.onload = () => {
      // Image is valid
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setError(null)
    }
    img.onerror = () => {
      setError("Invalid image file. Please upload a valid image.")
      setImageFile(null)
      setImagePreview(null)
    }
    img.src = URL.createObjectURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      let imageUrl: string | null = null

      if (imageFile) {
        // Validate again before upload
        if (imageFile.size > 5 * 1024 * 1024) {
          throw new Error("Image size must be less than 5MB")
        }

        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
        if (!validTypes.includes(imageFile.type)) {
          throw new Error("Please upload a valid image file (JPG, PNG, WEBP, or GIF)")
        }

        // Use the recommended Vercel Blob API format: pass file directly and filename in query params
        const res = await fetch(`/api/upload?filename=${encodeURIComponent(imageFile.name)}`, {
          method: "POST",
          body: imageFile, // Pass file directly as body (not FormData)
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Failed to upload image")
        }

        const blob = await res.json()
        if (!blob || !blob.url) {
          throw new Error("Image upload failed - no URL returned")
        }
        imageUrl = blob.url
      }

      const { error: insertError } = await supabase.from("products").insert({
        user_id: user.id,
        product_name: productName,
        product_type: productType,
        description,
        image_url: imageUrl,
        status: "pending",
      })

      if (insertError) throw insertError

      router.push("/dashboard/products")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload product")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <DashboardLayout title="Upload" backHref="/dashboard">
        <div className="space-y-10 w-full pb-8 md:pb-12">

          {/* HERO */}
          <div className="bg-black text-white w-full py-10 px-4 md:px-10 lg:px-16">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
              Upload Product
            </h1>
            <p className="text-white/70 mt-2 text-base sm:text-lg">
              Add a product to start customization and pricing
            </p>
          </div>

          {/* FORM CARD */}
          <div className="bg-white border border-black/20 w-full px-4 md:px-10 lg:px-16">
            <div className="border-b border-black/20 px-4 sm:px-6 py-4">
              <h2 className="text-xl sm:text-2xl font-black uppercase">
                Product Details
              </h2>
              <p className="text-sm sm:text-base text-black/60 mt-1">
                Tell us about the item you want to customize
              </p>
            </div>

            <div className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">

                {/* NAME */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest">
                    Product Name
                  </Label>
                  <Input
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                    placeholder="White T-Shirt, Running Shoes"
                    className="h-11 border-2 border-black/20 focus-visible:ring-0 focus:border-black"
                  />
                </div>

                {/* TYPE */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest">
                    Product Type
                  </Label>
                  <Select value={productType} onValueChange={setProductType} required>
                    <SelectTrigger className="h-11 border-2 border-black/20 focus:ring-0 focus:border-black">
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tshirt">T-Shirt</SelectItem>
                      <SelectItem value="hoodie">Hoodie</SelectItem>
                      <SelectItem value="shoes">Shoes</SelectItem>
                      <SelectItem value="cap">Cap</SelectItem>
                      <SelectItem value="mug">Mug</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* DESCRIPTION */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest">
                    Description (optional)
                  </Label>
                  <Textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Any additional details…"
                    className="border-2 border-black/20 resize-none focus-visible:ring-0 focus:border-black"
                  />
                </div>

                {/* IMAGE */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest">
                    Product Image
                  </Label>

                  {!imagePreview ? (
                    <label className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-black/30 py-10 sm:py-12 cursor-pointer hover:border-black transition bg-neutral-50">
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-black/40 mb-3" />
                      <p className="font-black uppercase text-sm">
                        Upload Image
                      </p>
                      <p className="text-xs text-black/50 mt-1">
                        JPG, PNG, WEBP • Max 5MB
                      </p>
                    </label>
                  ) : (
                    <div className="relative border-2 border-black/20 p-3 sm:p-4 mt-2 bg-white">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 sm:h-64 object-contain rounded"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-3 right-3 bg-black text-white p-2 hover:bg-black/80 rounded transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* ERROR */}
                {error && (
                  <div className="border-2 border-red-600 bg-red-50 text-red-600 px-4 py-3 text-sm font-bold rounded">
                    {error}
                  </div>
                )}

                {/* ACTIONS */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-black/10">
                  <Button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 h-12 bg-black text-white hover:bg-black/90 font-black uppercase text-sm sm:text-base"
                  >
                    {isUploading ? "Uploading…" : "Upload Product"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    className="h-12 border-2 border-black font-black uppercase hover:bg-black hover:text-white text-sm sm:text-base"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </DashboardLayout>

      {/* ✅ FOOTER ADDED */}
      <Footer />
    </>
  )
}
