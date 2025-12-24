import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(request: NextRequest) {
  try {
    const { cartItems, shippingInfo, paymentMethod } = await request.json()
    
    // Validate shipping info has required fields (check both camelCase and snake_case)
    const fullName = shippingInfo.fullName || shippingInfo.full_name
    const email = shippingInfo.email
    const phone = shippingInfo.phone
    const address = shippingInfo.address || shippingInfo.address_line1
    const city = shippingInfo.city
    const state = shippingInfo.state
    const zipCode = shippingInfo.zipCode || shippingInfo.zip_code

    if (!fullName || !email || !phone || !address || !city || !state || !zipCode) {
      return NextResponse.json(
        { 
          error: "All shipping information fields are required including: Full Name, Email, Phone Number, Address, City, State, and PIN Code" 
        },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate minimum amount for Stripe (₹0.50 = 50 paise per item)
    for (const item of cartItems) {
      if (item.product.price < 0.50) {
        return NextResponse.json(
          { error: `Minimum price per item is ₹0.50 (50 paise). Item "${item.product.name}" has invalid price.` },
          { status: 400 }
        )
      }
    }

    // Create line items for Stripe
    const lineItems = cartItems.map((item: any) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.product.name,
          description: `Size: ${item.size}, Color: ${item.color}`,
        },
        unit_amount: Math.round(item.product.price * 100), // Convert to paise (smallest INR unit)
      },
      quantity: item.quantity,
    }))

    // Get base URL - prioritize NEXT_PUBLIC_SITE_URL, fallback to Vercel's automatic URL, then origin
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
        // Last resort: use origin header (but validate it's not a blob URL)
        const origin = request.headers.get("origin")
        if (origin && !origin.includes('blob') && !origin.includes('vercel_blob') && (origin.startsWith('http://') || origin.startsWith('https://'))) {
          baseUrl = origin
        } else {
          // Final fallback (should only happen in local development)
          baseUrl = "http://localhost:3000"
        }
      }
    }

    // Validate baseUrl is a proper domain (not a blob URL)
    if (baseUrl.includes('blob') || baseUrl.includes('vercel_blob')) {
      console.error('[Checkout] Invalid baseUrl detected (blob URL):', baseUrl)
      baseUrl = "http://localhost:3000" // Safe fallback
    }

    // Store order in database FIRST (before creating Stripe session)
    // This ensures orders exist when webhook fires
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    const orderIds: string[] = []
    
    for (const item of cartItems) {
      try {
        // Prepare order data - ensure product_id is null for catalog products
        const orderData: any = {
          user_id: user.id,
          catalog_product_id: item.product.id,
          product_id: null, // Set to null for catalog product orders (custom products use product_id)
          quantity: item.quantity || 1,
          size: item.size || null,
          color: item.color || null,
          amount: Number((item.product.price * (item.quantity || 1)).toFixed(2)),
          payment_status: "pending",
          payment_method: paymentMethod || "card",
          order_number: orderNumber,
          shipping_address: {
            fullName: fullName,
            full_name: fullName,
            email: email,
            phone: phone,
            address: address,
            address_line1: address,
            address_line2: shippingInfo.address_line2 || null,
            city: city,
            state: state,
            zipCode: zipCode,
            zip_code: zipCode,
            country: shippingInfo.country || "India",
          },
          shipping_info: {
            fullName: fullName,
            full_name: fullName,
            email: email,
            phone: phone,
            address: address,
            address_line1: address,
            address_line2: shippingInfo.address_line2 || null,
            city: city,
            state: state,
            zipCode: zipCode,
            zip_code: zipCode,
            country: shippingInfo.country || "India",
          },
          order_status: "pending",
          shipping_status: "pending",
          order_type: "product",
        }

        const { data: order, error: insertError } = await supabase
          .from("orders")
          .insert(orderData)
          .select("id")
          .single()
        
        if (order && !insertError) {
          orderIds.push(order.id)
          console.log(`✅ Order created successfully for ${item.product.name}:`, order.id)
        } else {
          console.error("❌ Failed to create order for item:", item.product.name)
          if (insertError) {
            console.error("=== INSERT ERROR DETAILS ===")
            console.error("Error code:", insertError.code)
            console.error("Error message:", insertError.message)
            console.error("Error details:", insertError.details)
            console.error("Error hint:", insertError.hint)
            console.error("===========================")
            
            // Provide helpful error messages based on error code
            if (insertError.code === '23502') {
              console.error("❌ NOT NULL constraint violation - product_id might still be NOT NULL")
              console.error("   Solution: Run scripts/036_fix_checkout_orders_complete.sql")
            } else if (insertError.code === '42501') {
              console.error("❌ RLS policy violation - user doesn't have permission to insert")
              console.error("   Solution: Run scripts/036_fix_checkout_orders_complete.sql")
            } else if (insertError.code === '23503') {
              console.error("❌ Foreign key violation - catalog_product_id might not exist")
            }
          } else {
            console.error("No error object returned, but order creation failed")
          }
          console.error("Order data attempted:", JSON.stringify(orderData, null, 2))
          // Continue with other items even if one fails
        }
      } catch (err: any) {
        console.error("Error creating order:", err)
        console.error("Error stack:", err.stack)
        // Continue with other items
      }
    }

    if (orderIds.length === 0) {
      console.error("No orders were created. Cart items:", cartItems)
      console.error("This might be due to:")
      console.error("1. product_id column is still NOT NULL (run scripts/034_make_product_id_nullable.sql)")
      console.error("2. Missing RLS INSERT policy (run scripts/035_fix_orders_rls_policy.sql)")
      console.error("3. Database connection issue")
      return NextResponse.json(
        { 
          error: "Failed to create orders. Please ensure database migrations are applied. Check server logs for details." 
        },
        { status: 500 }
      )
    }

    // Create Stripe checkout session with order IDs in metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      customer_email: shippingInfo.email,
      metadata: {
        user_id: user.id,
        shipping_info: JSON.stringify(shippingInfo),
        order_ids: JSON.stringify(orderIds),
        order_type: "product",
      },
    })

    // Update orders with session ID for reference
    await supabase
      .from("orders")
      .update({ payment_intent_id: session.id })
      .in("id", orderIds)

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error("[v0] Checkout error:", error)
    let errorMessage = error.message || "Failed to create checkout session"
    
    // Replace dollar references with INR in error messages
    if (errorMessage.includes("50 cents") || errorMessage.includes("$0.01")) {
      errorMessage = "Minimum payment amount is ₹0.50 (50 paise) per item. Please ensure all product prices are at least ₹0.50."
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
