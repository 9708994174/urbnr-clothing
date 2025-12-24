"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CheckCircle, CreditCard } from "lucide-react"
import { Footer } from "@/components/footer"

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const [orderId, setOrderId] = useState<string | null>(null)
  const [order, setOrder] = useState<any>(null)
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "cod">("card")
  const router = useRouter()

  const paymentMethods = [
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: "💳",
      description: "Pay securely with your card",
      offers: ["5% cashback on orders above ₹2000"],
    },
    {
      id: "upi",
      name: "UPI",
      icon: "📱",
      description: "Pay with UPI apps",
      offers: ["10% cashback", "Instant payment"],
    },
    {
      id: "cod",
      name: "Cash on Delivery",
      icon: "💰",
      description: "Pay when you receive",
      offers: ["No extra charges", "Pay on delivery"],
    },
  ]

  useEffect(() => {
    params.then((p) => setOrderId(p.id))
  }, [params])

  useEffect(() => {
    if (!orderId) return

    async function fetchOrder() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: orderData } = await supabase
        .from("orders")
        .select(
          `
          *,
          products:product_id(*),
          catalog_products:catalog_product_id(*)
        `,
        )
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single()

      if (orderData) {
        setOrder(orderData)
        // Handle both product types
        const productData = orderData.products || orderData.catalog_products
        if (productData) {
          setProduct(Array.isArray(productData) ? productData[0] : productData)
        }

        if (orderData.payment_status === "paid") {
          router.push("/dashboard/orders")
        }
      }

      setIsLoading(false)
    }

    fetchOrder()
  }, [orderId, router])

  const handlePayment = async () => {
    setIsProcessing(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // For COD, update order directly without Stripe
      if (paymentMethod === "cod") {
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            payment_method: "cod",
            payment_status: "pending",
            order_status: "confirmed",
          })
          .eq("id", orderId)
          .eq("user_id", user.id)

        if (updateError) {
          throw new Error(updateError.message || "Failed to update order")
        }

        // Redirect to order success
        router.push(`/dashboard/orders/${orderId}`)
        return
      }

      // For Card and UPI, use Stripe checkout
      const response = await fetch("/api/checkout/customization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
          amount: order.amount,
          productId: product?.id || order.product_id || order.catalog_product_id,
          paymentMethod: paymentMethod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || data.message || "Failed to create checkout session"
        throw new Error(errorMessage)
      }

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL returned")
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert(error instanceof Error ? error.message : "Payment failed. Please try again.")
      setIsProcessing(false)
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

  if (!order) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <p className="text-muted-foreground">Order not found</p>
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
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                Checkout
              </h1>
              <p className="text-white/70 mt-2 text-base sm:text-lg">
                Complete your payment to start production
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="w-full px-4 md:px-10 lg:px-16 max-w-6xl mx-auto">

            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              {/* Order Summary */}
              <Card className="border-2 border-black/20">
                <CardHeader className="bg-black/5">
                  <CardTitle className="text-xl font-black uppercase">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {product?.image_url && (
                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-black/20">
                      <img
                        src={product.image_url || product?.image_url || "/placeholder.svg"}
                        alt={product?.product_name || product?.name || "Product"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Product</span>
                      <span className="font-black uppercase text-base">{product?.product_name || product?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <span className="font-semibold capitalize text-base">{product?.product_type || product?.category}</span>
                    </div>
                    {order.order_type === "customization" && (
                      <div className="pt-2 border-t border-black/10 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Customization Fee</span>
                          <span className="font-bold text-blue-600">₹{order.amount?.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">For applying template design to your product</p>
                      </div>
                    )}
                    {order.order_number && (
                      <div className="flex justify-between items-center text-xs pt-2 border-t border-black/10">
                        <span className="text-muted-foreground">Order Number</span>
                        <span className="font-mono font-semibold">{order.order_number}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-black pt-3 border-t-2 border-black/20">
                      <span>Total Amount</span>
                      <span className="text-xl">₹{order.amount?.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Section */}
              <div className="space-y-6">
                <Card className="border-2 border-black/20">
                  <CardHeader className="bg-black/5">
                    <CardTitle className="text-xl font-black uppercase flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Method
                    </CardTitle>
                    <CardDescription>Choose your preferred payment method</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as "card" | "upi" | "cod")}
                        className={`p-5 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === method.id
                            ? "border-black bg-black/5 shadow-md"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="text-4xl">{method.icon}</div>
                            <div className="flex-1">
                              <h3 className="font-black uppercase text-lg mb-1">{method.name}</h3>
                              <p className="text-sm text-muted-foreground">{method.description}</p>
                              <div className="mt-3 space-y-1.5">
                                {method.offers.map((offer, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs font-bold text-green-600 flex items-center gap-1.5"
                                  >
                                    <span className="text-green-600">✓</span>
                                    <span>{offer}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              paymentMethod === method.id
                                ? "border-black bg-black"
                                : "border-gray-300"
                            }`}
                          >
                            {paymentMethod === method.id && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button 
                      onClick={handlePayment} 
                      disabled={isProcessing} 
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-black uppercase text-base"
                      size="lg"
                    >
                      {isProcessing 
                        ? "Processing Payment..." 
                        : paymentMethod === "cod"
                        ? `Confirm Order ₹${order.amount?.toFixed(2)}`
                        : `Pay ₹${order.amount?.toFixed(2)}`
                      }
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-50 border-2 border-black/20">
                  <CardHeader className="bg-black/5">
                    <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      What Happens Next
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-2 text-sm text-black/70">
                    <p className="font-semibold">After successful payment:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>Your order will be confirmed immediately</li>
                      <li>Production will begin within 24 hours</li>
                      <li>You&apos;ll receive tracking information via email</li>
                      <li>Estimated delivery: 7-10 business days</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
      <Footer />
    </>
  )
}
