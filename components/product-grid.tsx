"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingBag, Star } from "lucide-react"
import type { Product } from "@/lib/types"
import { AuthModal } from "@/components/auth-modal"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

// Product Rating Display Component
function ProductRatingDisplay({ productId }: { productId: string }) {
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [ratingCount, setRatingCount] = useState(0)

  useEffect(() => {
    const loadRating = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("product_reviews")
        .select("rating")
        .eq("product_id", productId)

      if (!error && data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length
        setAverageRating(avg)
        setRatingCount(data.length)
      }
    }
    loadRating()
  }, [productId])

  if (!averageRating) return null

  return (
    <div className="flex items-center gap-1 mt-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= Math.round(averageRating)
                ? "fill-green-500 text-green-500"
                : "fill-gray-300 text-gray-300"
            }`}
          />
        ))}
      </div>
      <span className="text-green-600 font-bold text-xs">
        {averageRating.toFixed(1)} ({ratingCount})
      </span>
    </div>
  )
}
interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleAddToCart = async (product: Product) => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSelectedProduct(product)
      setAuthModalOpen(true)
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.from("cart_items").upsert(
        {
          user_id: user.id,
          product_id: product.id,
          quantity: 1,
          size: product.sizes?.[0] || null,
          color: product.colors?.[0] || null,
        },
        {
          onConflict: "user_id,product_id,size,color",
        },
      )

      if (error) throw error

      toast({
        title: "Added to cart!",
        description: `${product.name} has been added to your cart`,
      })

      setTimeout(() => router.push("/cart"), 500)
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleWishlist = async (product: Product) => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSelectedProduct(product)
      setAuthModalOpen(true)
      return
    }

    try {
      await supabase.from("wishlist").insert({
        user_id: user.id,
        product_id: product.id,
      })

      toast({
        title: "Added to wishlist!",
        description: `${product.name} has been saved to your wishlist`,
      })
    } catch (error) {
      console.error("Error adding to wishlist:", error)
      toast({
        title: "Info",
        description: "This item may already be in your wishlist",
      })
    }
  }

  const onAuthSuccess = async () => {
    if (selectedProduct) {
      await handleAddToCart(selectedProduct)
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-0 w-full">
        {products.map((product) => (
          <div key={product.id} className="group">
            <div className="relative aspect-[3/4] bg-muted overflow-hidden">
              <Link href={`/product/${product.id}`}>
                <img
                  src={product.image_url || "/placeholder.svg?height=400&width=300"}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                />
              </Link>
              <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 bg-background/90 hover:bg-background"
                  onClick={() => handleWishlist(product)}
                >
                  <Heart className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 bg-background/90 hover:bg-background"
                  onClick={() => handleAddToCart(product)}
                  disabled={isLoading}
                >
                  <ShoppingBag className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Link href={`/product/${product.id}`}>
                <h3 className="font-bold uppercase text-sm hover:text-accent transition-colors">{product.name}</h3>
              </Link>
              <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
              <p className="text-lg font-black">₹{product.price.toFixed(2)}</p>
              <ProductRatingDisplay productId={product.id} />
              {product.colors && product.colors.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {product.colors.slice(0, 4).map((color, idx) => (
                    <div
                      key={idx}
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: color.toLowerCase() }}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} onSuccess={onAuthSuccess} />
    </>
  )
}
