"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { loadStripe } from "@stripe/stripe-js"
import { Footer } from "@/components/footer"
import { ShopHeader } from "@/components/shop-header"
import { MapPin, CreditCard, Phone } from "lucide-react"
import Link from "next/link"
import { MobilePageHeader } from "@/components/mobile-page-header"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type CartItem = {
  id: string
  quantity: number
  size: string
  color: string
  product: {
    id: string
    name: string
    price: number
  }
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    address_line2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
  })
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "cod">("card")
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

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
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/signin")
        return
      }

      const { data, error } = await supabase
        .from("cart_items")
        .select(
          `
          id,
          quantity,
          size,
          color,
          product:catalog_products(id, name, price)
        `,
        )
        .eq("user_id", user.id)

      if (error) throw error
      if (!data || data.length === 0) {
        router.push("/cart")
        return
      }
      setCartItems(data)

      // Load user profile and shipping address for pre-filling
      const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", user.id).single()

      // Try to load default shipping address
      const { data: defaultAddress } = await supabase
        .from("shipping_addresses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .single()

      if (defaultAddress) {
        setShippingInfo({
          fullName: defaultAddress.full_name || "",
          email: defaultAddress.email || profile?.email || "",
          phone: defaultAddress.phone || "",
          address: defaultAddress.address_line1 || "",
          address_line2: defaultAddress.address_line2 || "",
          city: defaultAddress.city || "",
          state: defaultAddress.state || "",
          zipCode: defaultAddress.zip_code || "",
          country: defaultAddress.country || "India",
        })
      } else if (profile) {
        setShippingInfo((prev) => ({
          ...prev,
          email: profile.email || "",
          fullName: profile.full_name || "",
        }))
      }
    } catch (error) {
      console.error("Error loading cart:", error)
      toast({
        title: "Error",
        description: "Failed to load cart",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0)
  }

  const handleCheckout = async () => {
    if (!shippingInfo.fullName || !shippingInfo.email || !shippingInfo.phone || !shippingInfo.address || !shippingInfo.city || !shippingInfo.state || !shippingInfo.zipCode) {
      toast({
        title: "Incomplete information",
        description: "Please fill in all required fields including phone number, state, and ZIP code",
        variant: "destructive",
      })
      return
    }

    // Validate phone number (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(shippingInfo.phone.replace(/\D/g, ""))) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit Indian phone number",
        variant: "destructive",
      })
      return
    }

    try {
      setProcessing(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Try to save shipping address to database (optional - don't fail if table doesn't exist)
      try {
        // Check if default address exists
        const { data: existingAddress } = await supabase
          .from("shipping_addresses")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_default", true)
          .maybeSingle()

        // First, unset any existing default addresses
        await supabase
          .from("shipping_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .eq("is_default", true)

        // Then insert or update the address
        if (existingAddress) {
          // Update existing address
          const { error: updateError } = await supabase
            .from("shipping_addresses")
            .update({
              full_name: shippingInfo.fullName,
              email: shippingInfo.email,
              phone: shippingInfo.phone,
              address_line1: shippingInfo.address,
              address_line2: shippingInfo.address_line2 || null,
              city: shippingInfo.city,
              state: shippingInfo.state,
              zip_code: shippingInfo.zipCode,
              country: shippingInfo.country,
              is_default: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingAddress.id)

          if (updateError) {
            console.warn("Could not update shipping address (optional):", updateError.message)
          }
        } else {
          // Insert new address
          const { error: insertError } = await supabase.from("shipping_addresses").insert({
            user_id: user.id,
            full_name: shippingInfo.fullName,
            email: shippingInfo.email,
            phone: shippingInfo.phone,
            address_line1: shippingInfo.address,
            address_line2: shippingInfo.address_line2 || null,
            city: shippingInfo.city,
            state: shippingInfo.state,
            zip_code: shippingInfo.zipCode,
            country: shippingInfo.country,
            is_default: true,
            updated_at: new Date().toISOString(),
          })

          if (insertError) {
            console.warn("Could not save shipping address (optional):", insertError.message)
          }
        }
      } catch (err: any) {
        // Table might not exist or other error - that's okay, we'll save address in order
        console.warn("Shipping addresses table may not exist or error occurred - continuing anyway:", err?.message)
      }

      // For COD, create order directly without Stripe
      if (paymentMethod === "cod") {
        const supabase = createClient()
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        
        const orderIds: string[] = []
        for (const item of cartItems) {
          try {
            const { data: order, error: insertError } = await supabase.from("orders").insert({
              user_id: user.id,
              catalog_product_id: item.product.id,
              product_id: null, // Set to null for catalog product orders
              quantity: item.quantity || 1,
              size: item.size || null,
              color: item.color || null,
              amount: Number((item.product.price * (item.quantity || 1)).toFixed(2)),
              payment_status: "pending",
              payment_method: "cod",
              order_number: orderNumber,
              shipping_address: {
                fullName: shippingInfo.fullName,
                full_name: shippingInfo.fullName,
                email: shippingInfo.email,
                phone: shippingInfo.phone || "",
                address: shippingInfo.address,
                address_line1: shippingInfo.address,
                address_line2: shippingInfo.address_line2 || null,
                city: shippingInfo.city,
                state: shippingInfo.state,
                zipCode: shippingInfo.zipCode,
                zip_code: shippingInfo.zipCode,
                country: shippingInfo.country || "India",
              },
              shipping_info: {
                fullName: shippingInfo.fullName,
                full_name: shippingInfo.fullName,
                email: shippingInfo.email,
                phone: shippingInfo.phone || "",
                address: shippingInfo.address,
                address_line1: shippingInfo.address,
                address_line2: shippingInfo.address_line2 || null,
                city: shippingInfo.city,
                state: shippingInfo.state,
                zipCode: shippingInfo.zipCode,
                zip_code: shippingInfo.zipCode,
                country: shippingInfo.country || "India",
              },
              order_status: "pending",
              shipping_status: "pending",
              order_type: "product",
            }).select("id").single()
            
            if (order && !insertError) {
              orderIds.push(order.id)
            } else {
              console.error("Failed to create COD order:", insertError)
              toast({
                title: "Error",
                description: insertError?.message || "Failed to create order. Please try again.",
                variant: "destructive",
              })
              setProcessing(false)
              return
            }
          } catch (err: any) {
            console.error("Error creating COD order:", err)
            toast({
              title: "Error",
              description: err?.message || "Failed to create order. Please try again.",
              variant: "destructive",
            })
            setProcessing(false)
            return
          }
        }

        if (orderIds.length === 0) {
          toast({
            title: "Error",
            description: "Failed to create orders. Please try again.",
            variant: "destructive",
          })
          setProcessing(false)
          return
        }

        // Clear cart
        await supabase.from("cart_items").delete().eq("user_id", user.id)

        toast({
          title: "Order Placed!",
          description: "Your COD order has been placed successfully",
        })

        // Redirect to order detail page (use first order ID)
        if (orderIds.length > 0) {
          router.push(`/account/orders/${orderIds[0]}`)
        } else {
          router.push("/account?tab=orders")
        }
        return
      }

      // Create checkout session for card/UPI
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems,
          shippingInfo: {
            ...shippingInfo,
            fullName: shippingInfo.fullName,
            phone: shippingInfo.phone,
          },
          paymentMethod,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        const errorMessage = data.error || `HTTP ${response.status}: ${response.statusText}`
        console.error("Checkout API error:", errorMessage)
        throw new Error(errorMessage)
      }

      const { sessionId } = data

      if (!sessionId) {
        throw new Error("No session ID returned from checkout API")
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      if (stripe) {
        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId })
        if (stripeError) {
          throw stripeError
        }
      }
    } catch (error: any) {
      console.error("Checkout error:", error)
      const errorMessage = error.message || "An unexpected error occurred. Please try again."
      
      // Provide more helpful error messages
      let userFriendlyMessage = errorMessage
      if (errorMessage.includes("Failed to create orders")) {
        userFriendlyMessage = "Unable to process your order. Please check your cart and try again, or contact support."
      } else if (errorMessage.includes("Unauthorized")) {
        userFriendlyMessage = "Please sign in to continue with checkout."
        router.push("/auth/login")
      } else if (errorMessage.includes("minimum") || errorMessage.includes("price")) {
        userFriendlyMessage = "One or more items have an invalid price. Please check your cart."
      }
      
      toast({
        title: "Checkout Failed",
        description: userFriendlyMessage,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <ShopHeader />
      <div className="hidden lg:block h-16"></div> {/* Spacer for fixed header on desktop only */}
      <MobilePageHeader title="Checkout" backHref="/cart" />
      
      <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden pt-16 lg:pt-0">
        <div className="w-full px-4 md:px-10 lg:px-16 py-8 md:py-12 pb-8 md:pb-12">
          <div className="mb-6">
            <p className="text-muted-foreground">Complete your order with shipping and payment details</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Shipping & Payment */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Form */}
              <Card className="border-2 border-black/10">
                <CardHeader className="bg-black/5">
                  <CardTitle className="text-xl font-black uppercase flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName" className="text-sm font-bold uppercase">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={shippingInfo.fullName}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
                        placeholder="John Doe"
                        className="mt-2 h-12 border-2"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-bold uppercase">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                        placeholder="john@example.com"
                        className="mt-2 h-12 border-2"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-bold uppercase flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      placeholder="9876543210"
                      className="mt-2 h-12 border-2"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">10-digit Indian mobile number</p>
                  </div>
                  <div>
                    <Label htmlFor="address" className="text-sm font-bold uppercase">Street Address *</Label>
                    <Input
                      id="address"
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                      placeholder="House/Flat No., Building Name, Street"
                      className="mt-2 h-12 border-2"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_line2" className="text-sm font-bold uppercase">Address Line 2 (Optional)</Label>
                    <Input
                      id="address_line2"
                      value={shippingInfo.address_line2}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, address_line2: e.target.value })}
                      placeholder="Landmark, Area, Locality"
                      className="mt-2 h-12 border-2"
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city" className="text-sm font-bold uppercase">City *</Label>
                      <Input
                        id="city"
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                        placeholder="Mumbai"
                        className="mt-2 h-12 border-2"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state" className="text-sm font-bold uppercase">State *</Label>
                      <Input
                        id="state"
                        value={shippingInfo.state}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                        placeholder="Maharashtra"
                        className="mt-2 h-12 border-2"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode" className="text-sm font-bold uppercase">PIN Code *</Label>
                      <Input
                        id="zipCode"
                        value={shippingInfo.zipCode}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                        placeholder="400001"
                        className="mt-2 h-12 border-2"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="border-2 border-black/10">
                <CardHeader className="bg-black/5">
                  <CardTitle className="text-xl font-black uppercase flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => {
                      setPaymentMethod(method.id as "card" | "upi" | "cod")
                      if (method.id === "upi") {
                        setSelectedOffer("10% cashback")
                      } else {
                        setSelectedOffer(null)
                      }
                    }}
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
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-2 border-black/10">
                <CardHeader className="bg-black/5">
                  <CardTitle className="text-xl font-black uppercase">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                <div className="space-y-3 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <div className="font-bold">{item.product.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {item.size} / {item.color} × {item.quantity}
                        </div>
                      </div>
                      <div className="font-bold">₹{(item.product.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-bold">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-bold">FREE</span>
                  </div>
                  {selectedOffer && paymentMethod === "upi" && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-sm">Discount (10% UPI)</span>
                      <span className="font-bold text-sm">-₹{(calculateTotal() * 0.1).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-xl">
                      <span className="font-black">Total</span>
                      <span className="font-black text-accent">
                        ₹{selectedOffer && paymentMethod === "upi" ? (calculateTotal() * 0.9).toFixed(2) : calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                  <Button
                    size="lg"
                    className="w-full font-black uppercase text-base h-14 bg-black hover:bg-black/90 text-white"
                    onClick={handleCheckout}
                    disabled={processing}
                  >
                    {processing ? "Processing..." : paymentMethod === "cod" ? "Place Order" : "Proceed to Payment"}
                  </Button>
                  {paymentMethod === "cod" && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      You will pay ₹{calculateTotal().toFixed(2)} on delivery
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    By placing this order, you agree to our Terms & Conditions
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
