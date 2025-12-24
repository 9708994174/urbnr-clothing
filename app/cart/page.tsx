"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Trash2, ShoppingBag, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { ShopHeader } from "@/components/shop-header"
import { AuthModal } from "@/components/auth-modal"
import { SimilarProducts } from "@/components/similar-products"
import { MobilePageHeader } from "@/components/mobile-page-header"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Footer } from "@/components/footer"

type CartItem = {
  id: string
  quantity: number
  size: string | null
  color: string | null
  product: {
    id: string
    name: string
    price: number
    image_url: string | null
    category: string
  }
  rating?: {
    average: number
    count: number
  } | null
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuthAndLoadCart()
  }, [])

  const checkAuthAndLoadCart = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsAuthenticated(false)
        setAuthModalOpen(true)
        setLoading(false)
        return
      }

      setIsAuthenticated(true)
      await loadCart(user.id)
    } catch (error) {
      console.error("Error:", error)
      setLoading(false)
    }
  }

  const loadCart = async (userId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("cart_items")
        .select(
          `
          id,
          quantity,
          size,
          color,
          product:catalog_products(id, name, price, image_url, category)
        `,
        )
        .eq("user_id", userId)

      if (error) throw error
      
      // Load ratings for each product
      const itemsWithRatings = await Promise.all(
        ((data as any) || []).map(async (item: any) => {
          try {
            const { data: reviewsData } = await supabase
              .from("product_reviews")
              .select("rating")
              .eq("product_id", item.product.id)

            let rating = null
            if (reviewsData && reviewsData.length > 0) {
              const avg = reviewsData.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsData.length
              rating = {
                average: avg,
                count: reviewsData.length,
              }
            }
            return { ...item, rating }
          } catch (err) {
            return { ...item, rating: null }
          }
        })
      )
      
      setCartItems(itemsWithRatings)
    } catch (error) {
      console.error("Error loading cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      const supabase = createClient()
      await supabase.from("cart_items").update({ quantity: newQuantity }).eq("id", itemId)

      setCartItems((items) => items.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))
    } catch (error) {
      console.error("Error updating quantity:", error)
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      const supabase = createClient()
      await supabase.from("cart_items").delete().eq("id", itemId)
      setCartItems((items) => items.filter((item) => item.id !== itemId))

      toast({
        title: "Item removed",
        description: "Product has been removed from your cart",
      })
    } catch (error) {
      console.error("Error removing item:", error)
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      })
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0)
  }

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true)
      return
    }

    // Redirect to checkout page where user can enter shipping address and payment method
    router.push("/checkout")
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden">
        <ShopHeader />
        <div className="hidden lg:block h-16"></div> {/* Spacer for fixed header on desktop only */}
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground font-bold uppercase">Loading cart...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden">
        <ShopHeader />
        <div className="hidden lg:block h-16"></div> {/* Spacer for fixed header on desktop only */}
        <MobilePageHeader title="Cart" backHref="/shop" />
        <div className="flex items-center justify-center h-[60vh] pt-16 lg:pt-0">
          <div className="text-center max-w-md px-4">
            <ShoppingBag className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-3xl font-black uppercase mb-4">Sign in to view cart</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in or create an account to access your shopping cart
            </p>
          </div>
        </div>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} onSuccess={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      <ShopHeader />
      <div className="hidden lg:block h-16"></div> {/* Spacer for fixed header on desktop only */}
      <MobilePageHeader title="Cart" backHref="/shop" />

      <main className="w-full py-4 md:py-8 lg:py-12 px-4 md:px-10 lg:px-16 pt-20 lg:pt-4 pb-8 md:pb-12">
        {cartItems.length > 0 ? (
          <div className="grid lg:grid-cols-[2fr_1fr] gap-6 md:gap-8 w-full">
            {/* Cart Items */}
            <div className="space-y-4 md:space-y-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-3 md:gap-4 pb-4 md:pb-6 border-b">
                  {/* Product Image */}
                  <div className="w-full sm:w-32 md:w-40 lg:w-56 h-48 sm:h-32 md:h-40 lg:h-56 flex-shrink-0 bg-gray-100 overflow-hidden rounded-lg group">
                    <Link
                      href={`/product/${item.product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={item.product.image_url || "/placeholder.svg"}
                        alt={item.product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 cursor-pointer"
                      />
                    </Link>
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/product/${item.product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <h3 className="font-bold text-base md:text-lg mb-2 hover:underline line-clamp-2">{item.product.name}</h3>
                      </Link>
                      <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-gray-600 mb-2 md:mb-4">
                        <span>{item.size} | {item.color}</span>
                        <span>QTY | {item.quantity}</span>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-xs md:text-sm uppercase font-bold underline">
                        MOVE TO WISHLIST
                      </button>
                    </div>
                    
                    {/* Price and Actions */}
                    <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-2">
                      <button onClick={() => removeItem(item.id)} className="sm:mb-2 p-1 hover:bg-gray-100 rounded">
                        <Trash2 className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
                      </button>
                      <div className="text-right">
                        <p className="font-bold text-base md:text-lg">₹{item.product.price * item.quantity}</p>
                        {item.rating && (
                          <div className="flex items-center justify-end gap-1 mt-2">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= Math.round(item.rating!.average)
                                      ? "fill-green-500 text-green-500"
                                      : "fill-gray-300 text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-green-600 font-bold text-xs">
                              {item.rating.average.toFixed(1)} ({item.rating.count})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:sticky lg:top-24">
              <div className="border rounded-lg p-4 md:p-6 space-y-4 md:space-y-6 bg-white">
                <div className="flex items-center gap-2 pb-3 md:pb-4 border-b">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-sm">🎁</span>
                  </div>
                  <button className="text-xs md:text-sm font-medium">Login to view Coupons and Gift Cards</button>
                </div>

                <div>
                  <h3 className="font-bold uppercase mb-3 md:mb-4 text-sm md:text-base">PRICE DETAILS</h3>
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between text-sm md:text-base">
                      <span>Bag Total</span>
                      <span>₹{calculateTotal()}</span>
                    </div>
                    <div className="flex justify-between text-sm md:text-base">
                      <span>Coupon Discount</span>
                      <span className="text-green-600">- ₹0</span>
                    </div>
                    <div className="flex justify-between pt-2 md:pt-3 border-t font-bold text-base md:text-lg">
                      <span>Grand Total</span>
                      <span>₹{calculateTotal()}</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full h-12 md:h-14 bg-black hover:bg-gray-900 font-black uppercase text-sm md:text-base mb-3 md:mb-4"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  PAY ₹ {calculateTotal()}
                </Button>
                
                <Link href="/shop" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-11 md:h-12 border-black font-black uppercase text-sm md:text-base hover:bg-black hover:text-white"
                  >
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 md:py-16">
            <ShoppingBag className="h-20 w-20 md:h-24 md:w-24 text-gray-300 mx-auto mb-4 md:mb-6" />
            <h2 className="text-2xl md:text-3xl font-black uppercase mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6 md:mb-8">Start adding items to your cart</p>
            <Link href="/shop">
              <Button className="font-black uppercase h-12 md:h-14 px-6 md:px-8 bg-black hover:bg-black/90 text-white text-sm md:text-base">
                Continue Shopping
              </Button>
            </Link>
          </div>
        )}
      </main>

      {cartItems.length > 0 && (
        <SimilarProducts
          productId={cartItems[0].product.id}
          category={cartItems[0].product.category}
          title="YOU MAY ALSO LIKE"
        />
      )}

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} onSuccess={() => window.location.reload()} />
      <Footer />
    </div>
  )
}
