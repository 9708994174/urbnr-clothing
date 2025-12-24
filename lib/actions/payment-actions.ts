"use server"

import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function createCheckoutSession(cartItems: any[], shippingAddress?: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to checkout" }
  }

  try {
    // Get base URL - prioritize NEXT_PUBLIC_SITE_URL, fallback to Vercel's automatic URL
    let baseUrl: string
    
    // First, try NEXT_PUBLIC_SITE_URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (siteUrl && !siteUrl.includes('blob') && !siteUrl.includes('vercel_blob')) {
      baseUrl = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`
    } else {
      // Fallback to Vercel's automatic URL detection
      const vercelUrl = process.env.VERCEL_URL
      if (vercelUrl && !vercelUrl.includes('blob') && !vercelUrl.includes('vercel_blob')) {
        baseUrl = `https://${vercelUrl}`
      } else {
        // Final fallback (should only happen in local development)
        baseUrl = "http://localhost:3000"
      }
    }

    // Validate baseUrl is a proper domain (not a blob URL)
    if (baseUrl.includes('blob') || baseUrl.includes('vercel_blob')) {
      console.error('[Payment] Invalid baseUrl detected (blob URL):', baseUrl)
      baseUrl = "http://localhost:3000" // Safe fallback
    }

    const lineItems = cartItems.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.product.name,
          description: `Size: ${item.size}, Color: ${item.color}`,
        },
        unit_amount: Math.round(item.product.price * 100),
      },
      quantity: item.quantity,
    }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        cart_items: JSON.stringify(cartItems.map((i) => i.id)),
      },
    })

    return { success: true, sessionId: session.id, url: session.url }
  } catch (error: any) {
    console.error("[v0] Checkout error:", error)
    return { error: error.message }
  }
}

export async function handlePaymentSuccess(sessionId: string) {
  const supabase = await createClient()

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === "paid") {
      const userId = session.metadata.user_id
      
      // For cart orders, orders are already created by the webhook or checkout route
      // Just clear the cart items
      if (session.metadata.cart_items) {
        const cartItemIds = JSON.parse(session.metadata.cart_items)
        await supabase.from("cart_items").delete().in("id", cartItemIds)
      }

      return { success: true }
    }

    return { error: "Payment not completed" }
  } catch (error: any) {
    console.error("[v0] Payment success handler error:", error)
    return { error: error.message }
  }
}
