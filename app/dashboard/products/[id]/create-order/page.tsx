"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Footer } from "@/components/footer"

export default function CreateOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const [productId, setProductId] = useState<string | null>(null)
  const [product, setProduct] = useState<any>(null)
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    params.then((p) => setProductId(p.id))
  }, [params])

  useEffect(() => {
    if (!productId) return

    async function fetchProduct() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("user_id", user.id)
        .single()

      if (data) {
        setProduct(data)
        if (data.status !== "approved") {
          router.push(`/dashboard/products/${productId}`)
        }
        // Pre-fill amount with product price if available
        if (data.price) {
          setAmount(data.price.toString())
        }
      }

      setIsLoading(false)
    }

    fetchProduct()
  }, [productId, router])

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      // Validate amount
      const orderAmount = Number.parseFloat(amount)
      if (!orderAmount || orderAmount <= 0) {
        throw new Error("Please enter a valid amount")
      }
      
      // Validate minimum amount for Stripe (₹0.50 = 50 paise)
      if (orderAmount < 0.50) {
        throw new Error("Minimum order amount is ₹0.50 (50 paise)")
      }

      // Check if order already exists
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .eq("payment_status", "pending")
        .maybeSingle()

      if (existingOrder) {
        // Update existing order
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .update({
            amount: orderAmount,
          })
          .eq("id", existingOrder.id)
          .select()
          .single()

        if (orderError) throw orderError
        router.push(`/dashboard/orders/${order.id}/checkout`)
        return
      }

      // Create new order - start with minimal required fields
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      
      // Base order data with required fields only
      const baseOrderData: any = {
        user_id: user.id,
        product_id: productId,
        amount: orderAmount,
        payment_status: "pending",
      }

      // Try to insert with optional fields first
      const orderDataWithOptional = {
        ...baseOrderData,
        order_type: "product",
        order_number: orderNumber,
        order_status: "pending",
      }

      let order: any = null
      let orderError: any = null

      // First attempt with optional fields
      const { data: order1, error: error1 } = await supabase
        .from("orders")
        .insert(orderDataWithOptional)
        .select()
        .single()

      if (error1) {
        console.error("Order creation error (with optional fields):", error1)
        const error1Str = error1.message || error1.toString() || JSON.stringify(error1)
        console.error("Error details:", error1Str)
        
        // Second attempt without order_status
        const orderDataWithoutStatus = {
          ...baseOrderData,
          order_type: "product",
          order_number: orderNumber,
        }

        const { data: order2, error: error2 } = await supabase
          .from("orders")
          .insert(orderDataWithoutStatus)
          .select()
          .single()

        if (error2) {
          console.error("Order creation error (without order_status):", error2)
          const error2Str = error2.message || error2.toString() || JSON.stringify(error2)
          console.error("Error details:", error2Str)
          
          // Final attempt with only required fields
          const { data: order3, error: error3 } = await supabase
            .from("orders")
            .insert(baseOrderData)
            .select()
            .single()

          if (error3) {
            const errorMessage = error3.message || error3.details || error3.hint || JSON.stringify(error3)
            throw new Error(`Failed to create order: ${errorMessage}`)
          }
          order = order3
        } else {
          order = order2
        }
      } else {
        order = order1
      }

      if (!order || !order.id) {
        throw new Error("Order was created but no ID was returned")
      }

      router.push(`/dashboard/orders/${order.id}/checkout`)
    } catch (err: any) {
      console.error("Order creation failed:", err)
      const errorMessage = err?.message || err?.details || err?.hint || JSON.stringify(err) || "Failed to create order"
      setError(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <p className="text-muted-foreground">Product not found</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <>
      <DashboardLayout>
        <div className="space-y-8 sm:space-y-10 w-full pb-8 md:pb-12">
          {/* Header */}
          <div className="bg-black text-white w-full py-8 sm:py-10 px-4 md:px-10 lg:px-16">
            <Button variant="ghost" asChild className="mb-4 text-white hover:bg-white/10">
              <Link href={`/dashboard/products/${productId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Product
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                Create Order
              </h1>
              <p className="text-white/70 mt-2 text-base sm:text-lg">
                Set the order amount to proceed with payment
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="w-full px-4 md:px-10 lg:px-16 max-w-4xl mx-auto space-y-6">

            <div className="grid md:grid-cols-2 gap-6">
              {/* Product Information */}
              <Card className="border-2 border-black/20">
                <CardHeader className="bg-black/5">
                  <CardTitle className="text-xl font-black uppercase">Product Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {product.image_url && (
                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-black/20">
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Product Name</span>
                      <span className="font-black uppercase text-base">{product.product_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <span className="font-semibold capitalize text-base">{product.product_type}</span>
                    </div>
                    {product.description && (
                      <div className="pt-2 border-t border-black/10">
                        <p className="text-sm text-black/60">{product.description}</p>
                      </div>
                    )}
                    {product.price && (
                      <div className="flex justify-between items-center pt-2 border-t border-black/10">
                        <span className="text-sm text-muted-foreground">Approved Price</span>
                        <span className="font-bold text-green-600 text-lg">₹{product.price.toFixed(2)}</span>
                      </div>
                    )}
                    {product.customization_amount && product.customization_amount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Customization Fee</span>
                        <span className="font-bold text-blue-600">₹{product.customization_amount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Form */}
              <Card className="border-2 border-black/20">
                <CardHeader className="bg-black/5">
                  <CardTitle className="text-xl font-black uppercase">Order Details</CardTitle>
                  <CardDescription className="text-sm">
                    {product.price
                      ? "Confirm the order amount. Customization fee will be charged separately when applying templates."
                      : "Enter the approved price for this product"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleCreateOrder} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm font-black uppercase tracking-wider">
                        Order Amount (₹)
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder={product.price ? product.price.toString() : "0.00"}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        disabled={!!product.price}
                        className="h-12 border-2 border-black/20 focus:border-black text-lg font-semibold"
                      />
                      <p className="text-xs text-muted-foreground">
                        {product.price
                          ? "This is the approved product price. You'll pay the customization fee separately when applying template designs."
                          : "Enter the price provided by our team"}
                      </p>
                    </div>

                    {error && (
                      <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                        <p className="text-sm font-bold text-red-600">{error}</p>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      disabled={isCreating || !amount} 
                      variant="outline"
                      className="w-full h-10 bg-black text-white hover:bg-black/90 border-2 border-black hover:border-black font-black uppercase text-xs sm:text-sm"
                    >
                      {isCreating ? "Creating Order..." : "Order & Proceed to Payment"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
      <Footer />
    </>
  )
}
