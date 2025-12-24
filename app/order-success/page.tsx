"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ShopHeader } from "@/components/shop-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Package, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    
    // For cart orders, the webhook handles order creation
    // Just verify payment and clear cart if needed
    if (sessionId) {
      verifyPayment(sessionId)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  const verifyPayment = async (sessionId: string) => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Find the most recent order for this user (created within last 10 minutes)
      // This gives more time for webhook to process
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      
      // Try to find order by session ID first (from payment_intent_id)
      let { data: orders } = await supabase
        .from("orders")
        .select("id, payment_intent_id, created_at, payment_status")
        .eq("user_id", user.id)
        .eq("payment_intent_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(1)

      // If not found by session ID, find most recent paid order
      if (!orders || orders.length === 0) {
        const { data: recentOrders } = await supabase
          .from("orders")
          .select("id, payment_intent_id, created_at, payment_status")
          .eq("user_id", user.id)
          .eq("payment_status", "paid")
          .gte("created_at", tenMinutesAgo)
          .order("created_at", { ascending: false })
          .limit(1)
        orders = recentOrders
      }

      // Clear cart if items still exist
      await supabase.from("cart_items").delete().eq("user_id", user.id)
      
      // If we found an order, redirect to order detail page in account section
      if (orders && orders.length > 0) {
        // Small delay to ensure order is fully processed by webhook
        setTimeout(() => {
          router.push(`/account/orders/${orders[0].id}`)
        }, 2500)
      } else {
        // Fallback: redirect to account page with orders tab
        setTimeout(() => {
          router.push("/account?tab=orders")
        }, 2000)
      }
    } catch (err: any) {
      console.error("Error verifying payment:", err)
      // Redirect to account page as fallback
      setTimeout(() => {
        router.push("/account")
      }, 1000)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <ShopHeader />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-black" />
            <p className="text-lg font-black uppercase">Processing your order...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (error) {
    return (
      <>
        <ShopHeader />
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <Card className="max-w-md w-full border-2 border-red-200">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 text-3xl font-black">✕</span>
              </div>
              <h2 className="text-2xl font-black uppercase mb-4 tracking-tight">Order Failed</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button asChild className="bg-black text-white hover:bg-black/90 font-black uppercase">
                <Link href="/cart">Return to Cart</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <ShopHeader />
      <div className="min-h-screen bg-background flex items-center justify-center px-4 md:px-10 lg:px-16 py-12 pb-8 md:pb-12">
        <Card className="max-w-lg w-full border-2 border-black/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-black uppercase tracking-tight">Order Successful!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground text-lg">
              Thank you for your purchase! Your order has been successfully placed and is being processed.
            </p>
            
            <div className="bg-neutral-100 p-6 rounded-lg space-y-3 border-2 border-black/10">
              <Package className="h-8 w-8 text-black mx-auto mb-2" />
              <p className="font-black uppercase text-base">You'll receive an order confirmation email</p>
              <p className="text-sm text-muted-foreground">We'll notify you when your order ships</p>
              <p className="text-sm text-muted-foreground">Track your order from your account</p>
              <Link href="/account?tab=orders" className="text-sm font-black text-black hover:underline inline-block">
                View Orders →
              </Link>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button asChild size="lg" className="flex-1 font-black uppercase bg-black text-white hover:bg-black/90 h-12">
                <Link href="/account?tab=orders">View Orders</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex-1 font-black uppercase border-2 border-black hover:bg-black hover:text-white h-12">
                <Link href="/shop">Continue Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  )
}
