"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Heart, ShoppingCart, ArrowLeft, Minus, Plus, ZoomIn } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ProductReviews } from "@/components/product-reviews"
import { ShopHeader } from "@/components/shop-header"
import { Footer } from "@/components/footer"
import Image from "next/image"

type Product = {
  id: string
  name: string
  description: string
  category: string
  price: number
  image_url: string
  sizes: string[]
  colors: string[]
  is_featured: boolean
  stock_quantity: number
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [productImages, setProductImages] = useState<string[]>([])

  useEffect(() => {
    loadProduct()
    checkWishlist()
  }, [params.id])

  const loadProduct = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("catalog_products").select("*").eq("id", params.id).single()

      if (error) throw error
      setProduct(data)
      if (data.sizes?.length > 0) setSelectedSize(data.sizes[0])
      if (data.colors?.length > 0) setSelectedColor(data.colors[0])
      
      // Set up product images array
      // If product has multiple images, they should be stored in an array field or separate table
      // For now, using the main image_url and creating variations
      const images = data.image_url 
        ? [data.image_url] // Start with main image - you can add more images here
        : ["/placeholder.svg"]
      setProductImages(images)
      setSelectedImageIndex(0) // Reset to first image when product changes
    } catch (error) {
      console.error("Error loading product:", error)
      toast({
        title: "Error",
        description: "Failed to load product",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const checkWishlist = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", params.id)
        .single()

      setIsInWishlist(!!data)
    } catch (error) {
      // Not in wishlist
    }
  }

  const toggleWishlist = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to add items to wishlist",
        })
        router.push("/auth/signin")
        return
      }

      if (isInWishlist) {
        await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", params.id)
        setIsInWishlist(false)
        toast({ title: "Removed from wishlist" })
      } else {
        await supabase.from("wishlist").insert({ user_id: user.id, product_id: params.id })
        setIsInWishlist(true)
        toast({ title: "Added to wishlist" })
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      })
    }
  }

  const addToCart = async () => {
    try {
      setAddingToCart(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to add items to cart",
        })
        router.push("/auth/signin")
        return
      }

      // Check if item already in cart with same size/color
      const { data: existing } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", params.id)
        .eq("size", selectedSize)
        .eq("color", selectedColor)
        .single()

      if (existing) {
        // Update quantity
        await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id)
      } else {
        // Insert new cart item
        await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: params.id,
          quantity,
          size: selectedSize,
          color: selectedColor,
        })
      }

      toast({
        title: "Added to cart",
        description: "Product has been added to your cart",
      })
      router.push("/cart")
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "destructive",
      })
    } finally {
      setAddingToCart(false)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    // Clamp values to prevent zoom from going outside bounds
    const clampedX = Math.max(0, Math.min(100, x))
    const clampedY = Math.max(0, Math.min(100, y))
    setMousePosition({ x: clampedX, y: clampedY })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Button asChild>
            <Link href="/shop">Back to Shop</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <ShopHeader />
      <div className="hidden lg:block h-16"></div> {/* Spacer for fixed header on desktop only */}
      <div className="w-full pb-8 md:pb-12">
        <div className="w-full px-4 md:px-10 lg:px-16 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/shop">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Link>
        </Button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="flex gap-3 md:gap-4">
              {/* Thumbnail Images Sidebar */}
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[600px] md:max-h-[700px]">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImageIndex(idx)
                      setIsZoomed(false) // Reset zoom when changing image
                    }}
                    className={`relative w-16 h-20 md:w-20 md:h-24 flex-shrink-0 overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedImageIndex === idx 
                        ? "border-black scale-105 shadow-md ring-2 ring-black/20" 
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    aria-label={`View product image ${idx + 1}`}
                  >
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`Product view ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 64px, 80px"
                    />
                  </button>
                ))}
              </div>
              
              {/* Main Product Image with Zoom */}
              <div className="relative flex-1 aspect-square bg-neutral-100 overflow-hidden rounded-lg group">
                <div
                  className="relative w-full h-full cursor-zoom-in"
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                  onMouseMove={handleMouseMove}
                >
                  <div className="relative w-full h-full overflow-hidden">
                    <Image
                      src={productImages[selectedImageIndex] || product.image_url || `/placeholder.svg?height=600&width=600&query=${product.name}`}
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
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  </div>
                  <div className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    <ZoomIn className="h-5 w-5" />
                  </div>
                  {product.is_featured && (
                    <Badge className="absolute top-4 left-4 bg-accent text-white font-bold text-sm z-10">
                      FEATURED
                    </Badge>
                  )}
                  {product.stock_quantity === 0 && (
                    <Badge className="absolute bottom-4 left-4 bg-destructive text-white font-bold text-sm z-10">
                      OUT OF STOCK
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-4">
                {product.category.toUpperCase()}
              </Badge>
              <h1 className="text-4xl font-black mb-4">{product.name}</h1>
              <p className="text-3xl font-black text-accent mb-4">₹{product.price.toFixed(2)}</p>
              <p className="text-muted-foreground text-lg leading-relaxed">{product.description}</p>
            </div>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h3 className="font-bold text-sm uppercase mb-3">Select Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      onClick={() => setSelectedSize(size)}
                      className="min-w-[60px] font-bold"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="font-bold text-sm uppercase mb-3">Select Color</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <Button
                      key={color}
                      variant={selectedColor === color ? "default" : "outline"}
                      onClick={() => setSelectedColor(color)}
                      className="min-w-[80px] font-bold"
                    >
                      {color}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="font-bold text-sm uppercase mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  disabled={quantity >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1 font-bold uppercase text-base h-14"
                onClick={addToCart}
                disabled={product.stock_quantity === 0 || addingToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {addingToCart ? "Adding..." : "Add to Cart"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className={`font-bold h-14 ${isInWishlist ? "text-red-500 border-red-500" : ""}`}
                onClick={toggleWishlist}
              >
                <Heart className={`h-5 w-5 ${isInWishlist ? "fill-current" : ""}`} />
              </Button>
            </div>

            {/* Stock Info */}
            {product.stock_quantity > 0 && product.stock_quantity <= 10 && (
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <p className="text-sm font-bold text-yellow-800">Only {product.stock_quantity} left in stock!</p>
              </Card>
            )}
          </div>
        </div>

        {/* Product Reviews Section */}
        <div className="mt-16">
          <ProductReviews productId={params.id as string} />
        </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
