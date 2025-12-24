"use client"

import { useState } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronLeft, ChevronRight, Heart, Share2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AuthModal } from "@/components/auth-modal"
import { SimilarProducts } from "@/components/similar-products"
import { ProductReviews } from "@/components/product-reviews"
import Image from "next/image"
import type { Product } from "@/lib/types"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toggleWishlist } from "@/lib/actions/cart-actions"


interface ProductDetailsProps {
  product: Product
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || "")
  const [selectedColor, setSelectedColor] = useState<string>(product.colors?.[0] || "")
  const [quantity, setQuantity] = useState(1)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [sizeChartOpen, setSizeChartOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })
  const router = useRouter()

  const productImages = [
    product.image_url || "/placeholder.svg",
    product.image_url || "/placeholder.svg",
    product.image_url || "/placeholder.svg",
    product.image_url || "/placeholder.svg",
    product.image_url || "/placeholder.svg",
  ]

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    // Clamp values to prevent zoom from going outside bounds
    const clampedX = Math.max(0, Math.min(100, x))
    const clampedY = Math.max(0, Math.min(100, y))
    
    setMousePosition({ x: clampedX, y: clampedY })
  }

  const handleAddToCart = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setAuthModalOpen(true)
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.from("cart_items").upsert(
        {
          user_id: user.id,
          product_id: product.id,
          quantity,
          size: selectedSize,
          color: selectedColor,
        },
        {
          onConflict: "user_id,product_id,size,color",
        },
      )

      if (error) throw error
      router.push("/cart")
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getColorStyle = (color: string) => {
    const colorMap: Record<string, string> = {
      white: "#FFFFFF",
      black: "#000000",
      beige: "#F5F5DC",
      blue: "#4169E1",
      khaki: "#C3B091",
      olive: "#808000",
      navy: "#000080",
      grey: "#808080",
      gray: "#808080",
      brown: "#8B4513",
    }
    return colorMap[color.toLowerCase()] || "#CCCCCC"
  }

  const handleWishlistToggle = async () => {
    setWishlistLoading(true)
    const result = await toggleWishlist(product.id)
    if (result.success) {
      setIsWishlisted(result.added || false)
    }
    setWishlistLoading(false)
  }

  const handleShare = async (platform: string) => {
    const url = window.location.href
    const text = `Check out ${product.name} on URBNR!`

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      copy: url,
    }

    if (platform === "copy") {
      await navigator.clipboard.writeText(url)
      setShareOpen(false)
    } else {
      window.open(shareUrls[platform], "_blank", "width=600,height=400")
    }
  }

  return (
    <>
      <main className="w-full py-4 md:py-8 lg:py-12">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 w-full px-4 md:px-10 lg:px-16">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            {/* Thumbnail Images - Hidden on mobile, shown on larger screens */}
            <div className="hidden sm:flex flex-col gap-2 overflow-y-auto max-h-[400px] md:max-h-[600px] lg:max-h-[700px]">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedImage(idx)
                    setIsZoomed(false) // Reset zoom when changing image
                  }}
                  className={`relative w-16 h-20 md:w-20 md:h-24 flex-shrink-0 overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedImage === idx 
                      ? "border-black scale-105 shadow-md" 
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  aria-label={`View product image ${idx + 1}`}
                >
                  <Image 
                    src={img || "/placeholder.svg"} 
                    alt={`Product view ${idx + 1}`} 
                    fill 
                    className="object-cover" 
                  />
                </button>
              ))}
            </div>
            
            {/* Mobile Image Swiper - Show dots and arrows for navigation */}
            <div className="sm:hidden flex gap-2 justify-center items-center mb-2">
              {productImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedImage(idx)
                    setIsZoomed(false)
                  }}
                  className={`h-2 rounded-full transition-all ${
                    selectedImage === idx ? "w-8 bg-black" : "w-2 bg-gray-300"
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
            <div 
              className="relative w-full sm:flex-1 aspect-[3/4] bg-gray-50 overflow-hidden group cursor-zoom-in"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  src={productImages[selectedImage] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  style={
                    isZoomed
                      ? {
                          transform: `scale(2.5)`,
                          transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                          transition: "none", // No transition when zooming for smooth cursor following
                        }
                      : {
                          transform: "scale(1)",
                          transition: "transform 0.3s ease-out", // Smooth transition when zooming out
                        }
                  }
                  priority
                />
              </div>
              
              {/* Mobile Navigation Arrows */}
              <div className="sm:hidden absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-transparent hover:bg-black/10 rounded-full pointer-events-auto h-10 w-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImage((prev) => (prev > 0 ? prev - 1 : productImages.length - 1))
                    setIsZoomed(false)
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6 text-white drop-shadow-lg" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-transparent hover:bg-black/10 rounded-full pointer-events-auto h-10 w-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImage((prev) => (prev < productImages.length - 1 ? prev + 1 : 0))
                    setIsZoomed(false)
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6 text-white drop-shadow-lg" />
                </Button>
              </div>
              
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/90 hover:bg-white rounded-full shadow"
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/90 hover:bg-white rounded-full shadow"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase mb-2 md:mb-3">{product.name}</h1>
              <p className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 md:mb-4">₹{product.price.toFixed(0)}</p>
              {product.stock_quantity === 0 && (
                <p className="text-red-600 font-bold uppercase text-xs md:text-sm mb-3 md:mb-4">OUT OF STOCK</p>
              )}
            </div>

            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="font-bold uppercase mb-2 md:mb-3 text-xs md:text-sm tracking-wider">COLORS</h3>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`relative w-12 h-12 md:w-14 md:h-14 rounded border-2 transition-all ${
                        selectedColor === color ? "border-black scale-110" : "border-gray-300"
                      }`}
                      title={color}
                    >
                      <div className="w-full h-full rounded" style={{ backgroundColor: getColorStyle(color) }} />
                      {color.toLowerCase() === "white" && (
                        <div className="absolute inset-0 border border-gray-200 rounded" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2 md:mb-3">
                  <h3 className="font-bold uppercase text-xs md:text-sm tracking-wider">SIZES</h3>
                  <button onClick={() => setSizeChartOpen(true)} className="text-xs md:text-sm underline hover:no-underline">
                    SIZE CHART
                  </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-10 md:h-12 border-2 font-bold text-sm md:text-base transition-all ${
                        selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2 md:mt-3">FREE 1-2 day delivery on 5k+ pincodes</p>
              </div>
            )}

            <Button
              size="lg"
              className="w-full font-black uppercase h-12 md:h-14 bg-black hover:bg-gray-800 text-white text-sm md:text-base tracking-wide"
              onClick={handleAddToCart}
              disabled={isLoading || product.stock_quantity === 0}
            >
              {product.stock_quantity === 0 ? "OUT OF STOCK" : "ADD TO BAG"}
            </Button>

            <div className="space-y-0 border-t pt-6">
              <Collapsible>
                <CollapsibleTrigger className="flex justify-between items-center w-full py-4 border-b font-bold uppercase text-sm tracking-wider hover:text-gray-600 transition-colors">
                  DETAILS
                  <ChevronDown className="h-5 w-5 transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent className="py-4 text-sm text-gray-700 leading-relaxed">
                  <p>{product.description || "Premium quality menswear crafted with attention to detail."}</p>
                  <ul className="mt-3 space-y-1 list-disc list-inside">
                    <li>100% Premium Quality</li>
                    <li>Regular Fit</li>
                    <li>Machine Washable</li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible>
                <CollapsibleTrigger className="flex justify-between items-center w-full py-4 border-b font-bold uppercase text-sm tracking-wider hover:text-gray-600 transition-colors">
                  DELIVERY
                  <ChevronDown className="h-5 w-5 transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent className="py-4 text-sm text-gray-700">
                  <ul className="space-y-2">
                    <li>• Free delivery on orders over ₹999</li>
                    <li>• Standard delivery: 3-5 business days</li>
                    <li>• Express delivery available at checkout</li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible>
                <CollapsibleTrigger className="flex justify-between items-center w-full py-4 border-b font-bold uppercase text-sm tracking-wider hover:text-gray-600 transition-colors">
                  RETURNS
                  <ChevronDown className="h-5 w-5 transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent className="py-4 text-sm text-gray-700">
                  <ul className="space-y-2">
                    <li>• 30-day easy returns policy</li>
                    <li>• Free return pickup from your location</li>
                    <li>• Full refund or exchange available</li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>
      </main>

      <SimilarProducts productId={product.id} category={product.category} title="YOU MAY ALSO LIKE" />

      {/* Customer Reviews Section */}
      <section className="w-full px-4 md:px-10 lg:px-16 py-8 md:py-12">
        <ProductReviews productId={product.id} />
      </section>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} onSuccess={handleAddToCart} />

      <Dialog open={sizeChartOpen} onOpenChange={setSizeChartOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="uppercase font-black text-2xl">SIZE CHART</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left font-bold uppercase">Size</th>
                  <th className="p-3 text-center font-bold uppercase">Chest (in)</th>
                  <th className="p-3 text-center font-bold uppercase">Waist (in)</th>
                  <th className="p-3 text-center font-bold uppercase">Length (in)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-bold">28</td>
                  <td className="p-3 text-center">36</td>
                  <td className="p-3 text-center">28</td>
                  <td className="p-3 text-center">40</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-bold">30</td>
                  <td className="p-3 text-center">38</td>
                  <td className="p-3 text-center">30</td>
                  <td className="p-3 text-center">41</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-bold">32</td>
                  <td className="p-3 text-center">40</td>
                  <td className="p-3 text-center">32</td>
                  <td className="p-3 text-center">42</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-bold">34</td>
                  <td className="p-3 text-center">42</td>
                  <td className="p-3 text-center">34</td>
                  <td className="p-3 text-center">43</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-bold">36</td>
                  <td className="p-3 text-center">44</td>
                  <td className="p-3 text-center">36</td>
                  <td className="p-3 text-center">44</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">38</td>
                  <td className="p-3 text-center">46</td>
                  <td className="p-3 text-center">38</td>
                  <td className="p-3 text-center">45</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded text-sm">
            <p className="font-bold mb-2">How to Measure:</p>
            <ul className="space-y-1 text-gray-700">
              <li>
                • <strong>Chest:</strong> Measure around the fullest part of your chest
              </li>
              <li>
                • <strong>Waist:</strong> Measure around your natural waistline
              </li>
              <li>
                • <strong>Length:</strong> Measure from shoulder to desired length
              </li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase font-black text-2xl">SHARE THIS PRODUCT</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2 font-bold uppercase bg-transparent"
              onClick={() => handleShare("facebook")}
            >
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2 font-bold uppercase bg-transparent"
              onClick={() => handleShare("twitter")}
            >
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
              Twitter
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2 font-bold uppercase bg-transparent"
              onClick={() => handleShare("whatsapp")}
            >
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2 font-bold uppercase bg-transparent"
              onClick={() => handleShare("copy")}
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
