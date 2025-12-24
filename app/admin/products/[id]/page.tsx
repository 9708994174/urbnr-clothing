"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Package, CheckCircle, XCircle, Clock, AlertCircle, ShieldCheck } from "lucide-react"
import { ShopHeader } from "@/components/shop-header"
import { Footer } from "@/components/footer"
import { MobilePageHeader } from "@/components/mobile-page-header"
import { approveProduct, rejectProduct, updateProductStatus } from "@/lib/actions/admin-actions"
import { useToast } from "@/hooks/use-toast"

export default function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [productId, setProductId] = useState<string | null>(null)
  const [product, setProduct] = useState<any>(null)
  const [productDesign, setProductDesign] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [status, setStatus] = useState("")
  const [notes, setNotes] = useState("")
  const [price, setPrice] = useState("")
  const [customizationAmount, setCustomizationAmount] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    params.then((p) => setProductId(p.id))
  }, [params])

  useEffect(() => {
    if (!productId) return

    async function fetchData() {
      const supabase = createClient()

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", currentUser.id).single()
      if (!profile || profile.role !== "admin") {
        router.push("/dashboard")
        return
      }

      const { data: productData } = await supabase
        .from("products")
        .select(
          `
          *,
          profiles!products_user_id_fkey(*)
        `,
        )
        .eq("id", productId)
        .single()

      if (productData) {
        setProduct(productData)
        setUser(productData.profiles)
        setStatus(productData.status)
        setPrice(productData.price?.toString() || "")
        setCustomizationAmount(productData.customization_amount?.toString() || "")

        const { data: designData } = await supabase
          .from("product_designs")
          .select(
            `
            *,
            designs(*)
          `,
          )
          .eq("product_id", productId)
          .single()

        if (designData) {
          setProductDesign(designData)
        }
      }

      setIsLoading(false)
    }

    fetchData()
  }, [productId, router])

  const handleApprove = async () => {
    if (!productId) {
      toast({
        title: "Error",
        description: "Product ID is missing",
        variant: "destructive",
      })
      return
    }

    if (!price || parseFloat(price) <= 0) {
      toast({
        title: "Price Required",
        description: "Please enter a valid price before approving",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const result = await approveProduct(
        productId,
        parseFloat(price),
        notes,
        customizationAmount ? parseFloat(customizationAmount) : undefined
      )
      if (result.success) {
        toast({
          title: "Product Approved",
          description: "The product has been approved successfully",
        })
        router.push("/admin/products")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to approve product",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Approval error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReject = async () => {
    if (!productId) {
      toast({
        title: "Error",
        description: "Product ID is missing",
        variant: "destructive",
      })
      return
    }

    if (!notes || notes.trim().length === 0) {
      toast({
        title: "Notes Required",
        description: "Please provide rejection notes",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const result = await rejectProduct(productId, notes)
      if (result.success) {
        toast({
          title: "Product Rejected",
          description: "The product has been rejected",
        })
        router.push("/admin/products")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to reject product",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Rejection error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!productId) {
      toast({
        title: "Error",
        description: "Product ID is missing",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const result = await updateProductStatus(productId, status, notes)
      if (result.success) {
        toast({
          title: "Status Updated",
          description: "Product status has been updated successfully",
        })
        setProduct({ ...product, status })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Status update error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <ShopHeader />
        <div className="hidden lg:block h-16"></div>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    )
  }

  if (!product) {
    return (
      <>
        <ShopHeader />
        <div className="hidden lg:block h-16"></div>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Product not found</p>
        </div>
      </>
    )
  }

  const getStatusBadge = () => {
    switch (status) {
      case "approved":
        return { icon: CheckCircle, color: "bg-green-500", text: "Approved" }
      case "rejected":
        return { icon: XCircle, color: "bg-red-500", text: "Rejected" }
      case "under_review":
        return { icon: Clock, color: "bg-blue-500", text: "Under Review" }
      case "pending":
        return { icon: AlertCircle, color: "bg-yellow-500", text: "Pending" }
      default:
        return { icon: Package, color: "bg-gray-500", text: status }
    }
  }

  const statusInfo = getStatusBadge()
  const StatusIcon = statusInfo.icon

  return (
    <>
      <ShopHeader />
      <div className="min-h-screen bg-background w-full overflow-x-hidden">
        <div className="hidden lg:block h-16"></div>
        <MobilePageHeader title="Product Details" backHref="/admin/products" />
        <header className="border-b bg-black text-white w-full pt-16 lg:pt-0">
          <div className="w-full px-4 md:px-10 lg:px-16 py-8 md:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" className="h-10 text-white hover:bg-white/10 hover:text-white" asChild>
                  <Link href="/admin/products">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Products
                  </Link>
                </Button>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">Product Details</h1>
                  <p className="text-base sm:text-lg text-white/70 mt-3 sm:mt-2">Review and manage product submission</p>
                </div>
              </div>
              <Badge className={`${statusInfo.color} text-white h-10 w-full sm:w-auto flex items-center justify-center text-xs sm:text-sm font-black uppercase px-4 border-2`}>
                <StatusIcon className="h-4 w-4 mr-2" />
                {statusInfo.text}
              </Badge>
            </div>
          </div>
        </header>

        <main className="w-full px-4 md:px-10 lg:px-16 py-8 pb-8 md:pb-12">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.image_url ? (
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100">
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg flex items-center justify-center">
                      <Package className="h-24 w-24 text-neutral-400" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Product Name</p>
                        <p className="font-semibold text-lg">{product.product_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Type</p>
                        <p className="font-semibold capitalize">{product.product_type}</p>
                      </div>
                    </div>

                    {product.description && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Description</p>
                        <p className="text-sm leading-relaxed">{product.description}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                      <p className="text-sm">{new Date(product.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {productDesign && (
                <Card>
                  <CardHeader>
                    <CardTitle>Design Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Design Type</p>
                      <p className="font-semibold">{productDesign.is_custom ? "Custom Design" : "Prebuilt Template"}</p>
                    </div>
                    {productDesign.designs && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Design Name</p>
                          <p className="font-semibold">{productDesign.designs.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Description</p>
                          <p className="text-sm">{productDesign.designs.description}</p>
                        </div>
                      </>
                    )}
                    {productDesign.custom_design_data && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Custom Design Preview</p>
                        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center p-4">
                          {productDesign.custom_design_data.type === "text" ? (
                            <p
                              style={{
                                fontSize: `${productDesign.custom_design_data.fontSize}px`,
                                color: productDesign.custom_design_data.color,
                              }}
                              className="font-bold text-center"
                            >
                              {productDesign.custom_design_data.text}
                            </p>
                          ) : productDesign.custom_design_data.type === "image" &&
                            productDesign.custom_design_data.image ? (
                            <img
                              src={productDesign.custom_design_data.image || "/placeholder.svg"}
                              alt="Custom design"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <p className="text-muted-foreground">Design preview not available</p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold">{user?.full_name || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Since</p>
                    <p className="text-sm">{new Date(user?.created_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-2">
                <CardHeader className="bg-muted/50">
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Review & Approval
                  </CardTitle>
                  <CardDescription>Update status and provide feedback to customer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Required for approval</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customizationAmount">Customization Amount (₹)</Label>
                    <Input
                      id="customizationAmount"
                      type="number"
                      step="0.01"
                      placeholder="299.00"
                      value={customizationAmount}
                      onChange={(e) => setCustomizationAmount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Amount user needs to pay to customize this product with template designs (default: ₹299)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes / Feedback</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes or feedback for the customer..."
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Required for rejection</p>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={handleApprove}
                        disabled={isSaving || status === "approved" || !price}
                        variant="outline"
                        className="w-full bg-green-600 hover:bg-green-700 text-white border-2 border-green-600 hover:border-green-700 font-black uppercase text-xs sm:text-sm h-10"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={handleReject}
                        disabled={isSaving || status === "rejected" || !notes}
                        variant="outline"
                        className="w-full bg-red-600 hover:bg-red-700 text-white border-2 border-red-600 hover:border-red-700 font-black uppercase text-xs sm:text-sm h-10"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>

                    <Button
                      onClick={handleUpdateStatus}
                      disabled={isSaving}
                      variant="outline"
                      className="w-full border-2 border-black hover:bg-black hover:text-white font-black uppercase text-xs sm:text-sm h-10"
                    >
                      {isSaving ? "Updating..." : "Update Status Only"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg">Review Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <label className="flex items-start gap-2 cursor-pointer hover:bg-background/50 p-2 rounded transition-colors">
                    <input type="checkbox" className="mt-1" />
                    <span>Design is technically feasible for this product type</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer hover:bg-background/50 p-2 rounded transition-colors">
                    <input type="checkbox" className="mt-1" />
                    <span>Image quality is sufficient for production</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer hover:bg-background/50 p-2 rounded transition-colors">
                    <input type="checkbox" className="mt-1" />
                    <span>No copyright or trademark violations</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer hover:bg-background/50 p-2 rounded transition-colors">
                    <input type="checkbox" className="mt-1" />
                    <span>Pricing is accurate for production method</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer hover:bg-background/50 p-2 rounded transition-colors">
                    <input type="checkbox" className="mt-1" />
                    <span>Customer contact information is verified</span>
                  </label>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
