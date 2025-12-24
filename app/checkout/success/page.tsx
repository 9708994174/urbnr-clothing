"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Package } from "lucide-react"
import Link from "next/link"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const sessionId = searchParams.get("session_id")

  useEffect(() => {
    if (sessionId) {
      handlePaymentSuccess()
    } else {
      setLoading(false)
    }
  }, [sessionId])

  const handlePaymentSuccess = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const orderId = searchParams.get("order_id")

      // If order_id is present, it's a customization order
      if (orderId) {
        // Update order status
        const { data: order } = await supabase
          .from("orders")
          .select("*, products:product_id(*), catalog_products:catalog_product_id(*)")
          .eq("id", orderId)
          .eq("user_id", user.id)
          .single()

        if (order && order.payment_status !== "paid") {
          await supabase
            .from("orders")
            .update({
              payment_status: "paid",
              order_status: order.order_type === "customization" ? "confirmed" : "confirmed",
            })
            .eq("id", orderId)

          // Update product status for customization orders
          if (order.order_type === "customization" && order.product_id) {
            await supabase
              .from("products")
              .update({ status: "under_review" })
              .eq("id", order.product_id)
          }

          // Create order tracking entry
          await supabase.from("order_tracking").insert({
            order_id: orderId,
            status: "confirmed",
            message: "Payment received and order confirmed",
          })
        }
      } else {
        // Regular cart order - clear cart
        await supabase.from("cart_items").delete().eq("user_id", user.id)
      }
    } catch (error) {
      console.error("Error processing payment success:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Processing your order...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-lg w-full mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-black uppercase">Order Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground text-lg">
            Thank you for your purchase! Your order has been successfully placed and is being processed.
          </p>
          <div className="bg-neutral-100 p-4 rounded-lg space-y-2">
            <Package className="h-8 w-8 text-accent mx-auto mb-2" />
            <p className="font-bold">You'll receive an order confirmation email</p>
            <p className="text-sm text-muted-foreground">We'll notify you when your order ships</p>
            <p className="text-sm text-muted-foreground">Track your order from your account</p>
            <Link href="/dashboard/orders" className="text-sm font-bold text-accent hover:underline">
              View Orders →
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="flex-1 font-bold uppercase">
              <Link href="/dashboard/orders">View Orders</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1 font-bold uppercase bg-transparent">
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
