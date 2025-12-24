"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Type, ImageIcon, Shapes, Upload, X } from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { createClient } from "@/lib/supabase/client"

export default function CustomDesignPage() {
  const [designName, setDesignName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [designType, setDesignType] =
    useState<"text" | "image" | "shape">("text")
  const [textContent, setTextContent] = useState("")
  const [fontSize, setFontSize] = useState([24])
  const [color, setColor] = useState("#000000")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  /* ---------------- FETCH PRODUCTS ---------------- */
  useEffect(() => {
    async function fetchProducts() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")

      setProducts(data || [])
    }

    fetchProducts()
  }, [])

  /* ---------------- IMAGE UPLOAD ---------------- */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setUploadedImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const designData = {
        type: designType,
        text: textContent,
        fontSize: fontSize[0],
        color,
        image: uploadedImage,
      }

      const { data: design, error: designError } = await supabase
        .from("designs")
        .insert({
          name: designName,
          description,
          is_prebuilt: false,
          created_by: user.id,
          design_data: designData,
        })
        .select()
        .single()

      if (designError) throw designError

      await supabase.from("product_designs").insert({
        product_id: selectedProduct,
        design_id: design.id,
        is_custom: true,
        custom_design_data: designData,
      })

      await supabase
        .from("products")
        .update({ status: "under_review" })
        .eq("id", selectedProduct)

      router.push("/dashboard/products")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create design")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DashboardLayout>
        {/* MAIN CONTENT */}
        <div className="max-w-7xl mx-auto space-y-12 pb-8 md:pb-12">

          {/* HERO (spaced from header) */}
          <div className="bg-black text-white px-8 py-10 mt-10 rounded-2xl">
            <h1 className="text-4xl font-black uppercase tracking-tight">
              Create Custom Design
            </h1>
            <p className="text-white/70 mt-2 text-lg">
              Design your own graphics for your products
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-10">

            {/* LEFT COLUMN */}
            <div className="space-y-8">

              {/* DESIGN DETAILS */}
              <div className="bg-white border border-black/20 p-6">
                <h2 className="text-xl font-black uppercase mb-4">
                  Design Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-black uppercase tracking-widest">
                      Design Name
                    </Label>
                    <Input
                      value={designName}
                      onChange={(e) => setDesignName(e.target.value)}
                      required
                      className="h-11 border border-black/30"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-black uppercase tracking-widest">
                      Description
                    </Label>
                    <Textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="border border-black/30 resize-none"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-black uppercase tracking-widest">
                      Apply To Product
                    </Label>
                    <Select
                      value={selectedProduct}
                      onValueChange={setSelectedProduct}
                      required
                    >
                      <SelectTrigger className="h-11 border border-black/30">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.product_name} ({p.product_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* DESIGN TYPE */}
              <div className="bg-white border border-black/20 p-6">
                <h2 className="text-xl font-black uppercase mb-4">
                  Design Type
                </h2>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    ["text", Type],
                    ["image", ImageIcon],
                    ["shape", Shapes],
                  ].map(([type, Icon]: any) => (
                    <Button
                      key={type}
                      type="button"
                      onClick={() => setDesignType(type)}
                      className={`h-20 flex flex-col gap-2 border font-black uppercase ${
                        designType === type
                          ? "bg-black text-white"
                          : "bg-white text-black border-black/30"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs">{type}</span>
                    </Button>
                  ))}
                </div>

                {designType === "text" && (
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter text"
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      className="h-14 text-lg px-4"
                    />

                    <div>
                      <Label className="text-xs font-black uppercase">
                        Font Size: {fontSize[0]}px
                      </Label>
                      <Slider
                        min={12}
                        max={72}
                        value={fontSize}
                        onValueChange={setFontSize}
                      />
                    </div>

                    <Input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-24"
                    />
                  </div>
                )}

                {designType === "image" && (
                  <div className="border border-dashed border-black/40 p-8 text-center">
                    {!uploadedImage ? (
                      <>
                        <input
                          type="file"
                          hidden
                          id="design-image"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        <label htmlFor="design-image" className="cursor-pointer">
                          <Upload className="h-10 w-10 mx-auto mb-2 text-black/50" />
                          <p className="font-black uppercase text-sm">
                            Upload Image
                          </p>
                        </label>
                      </>
                    ) : (
                      <div className="relative">
                        <img
                          src={uploadedImage}
                          className="h-40 mx-auto object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setUploadedImage(null)}
                          className="absolute top-2 right-2 bg-black text-white p-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-8">

              {/* PREVIEW */}
              <div className="bg-white border border-black/20 p-6">
                <h2 className="text-xl font-black uppercase mb-4">
                  Preview
                </h2>

                <div className="aspect-square bg-neutral-100 flex items-center justify-center">
                  {designType === "text" && textContent ? (
                    <p
                      style={{ fontSize: fontSize[0], color }}
                      className="font-black"
                    >
                      {textContent}
                    </p>
                  ) : designType === "image" && uploadedImage ? (
                    <img src={uploadedImage} className="max-h-full" />
                  ) : (
                    <p className="text-black/40">
                      Design preview will appear here
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="border border-red-600 text-red-600 p-3 font-bold">
                  {error}
                </div>
              )}

              {/* SUBMIT BUTTON (spaced from footer) */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isLoading || !selectedProduct}
                  className="h-12 w-full bg-black text-white font-black uppercase"
                >
                  {isLoading ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DashboardLayout>

      {/* FOOTER */}
      <Footer />
    </>
  )
}
