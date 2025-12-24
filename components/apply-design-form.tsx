"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface ApplyDesignFormProps {
  designId: string
  userProducts: any[]
}

export function ApplyDesignForm({ designId, userProducts }: ApplyDesignFormProps) {
  const [selectedProduct, setSelectedProduct] = useState("")
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customizationAmount, setCustomizationAmount] = useState<number | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Get customization amount when product is selected
  useEffect(() => {
    if (selectedProduct) {
      const product = userProducts.find((p) => p.id === selectedProduct)
      if (product?.customization_amount && product.customization_amount > 0) {
        setCustomizationAmount(product.customization_amount)
      } else {
        // Check if design has a fixed template rate
        const fetchDesignRate = async () => {
          const supabase = createClient()
          const { data: design } = await supabase
            .from("designs")
            .select("template_rate, is_prebuilt")
            .eq("id", designId)
            .single()
          
          if (design?.is_prebuilt && design?.template_rate) {
            setCustomizationAmount(parseFloat(design.template_rate.toString()))
          } else {
            setCustomizationAmount(null)
          }
        }
        fetchDesignRate()
      }
    }
  }, [selectedProduct, userProducts, designId])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsApplying(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please login to apply designs",
          variant: "destructive",
        })
        return
      }

      // Get design details to check for template rate
      const { data: design } = await supabase.from("designs").select("template_rate, is_prebuilt").eq("id", designId).single()
      
      // Determine the amount to charge
      let amountToCharge = 0
      if (customizationAmount && customizationAmount > 0) {
        amountToCharge = customizationAmount
      } else if (design?.is_prebuilt && design?.template_rate) {
        amountToCharge = parseFloat(design.template_rate.toString())
      }

      // Link design to product
      const { error: insertError } = await supabase.from("product_designs").insert({
        product_id: selectedProduct,
        design_id: designId,
        is_custom: false,
      })

      if (insertError) throw insertError

      // Update product status to under review
      const { error: updateError } = await supabase
        .from("products")
        .update({ status: "under_review" })
        .eq("id", selectedProduct)

      if (updateError) throw updateError

      // If payment is required, create an order
      if (amountToCharge > 0) {
        const orderNumber = `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            product_id: selectedProduct,
            amount: amountToCharge,
            payment_status: "pending",
            order_type: "customization",
            order_number: orderNumber,
          })
          .select()
          .single()

        if (orderError) throw orderError

        toast({
          title: "Design Applied",
          description: `Customization order created. Please complete payment of ₹${amountToCharge.toFixed(2)}`,
        })

        // Redirect to checkout
        router.push(`/dashboard/orders/${order.id}/checkout`)
        return
      }

      toast({
        title: "Design Applied",
        description: "Design has been successfully applied to your product",
      })

      router.push("/dashboard/products")
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to apply design"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsApplying(false)
    }
  }

  if (userProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Products Available</CardTitle>
          <CardDescription>Upload a product first to apply this design</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/dashboard/upload">Upload Product</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply to Your Product</CardTitle>
        <CardDescription>Select a product to use this design</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleApply} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Select Product</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct} required>
              <SelectTrigger>
                <SelectValue placeholder="Choose a product" />
              </SelectTrigger>
              <SelectContent>
                {userProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.product_name} ({product.product_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {customizationAmount && customizationAmount > 0 && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-bold text-blue-900">
                  Customization Amount: ₹{customizationAmount.toFixed(2)}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  This amount will be charged to customize your product with this template design. You'll be redirected to payment after applying the design.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={isApplying || !selectedProduct} className="w-full">
            {isApplying ? "Applying Design..." : "Apply Design"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
