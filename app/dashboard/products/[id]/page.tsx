import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Package, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react"
import { requireAuth } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import { Footer } from "@/components/footer"
import { DashboardProductImage } from "@/components/dashboard-product-image"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: product } = await supabase.from("products").select("*").eq("id", id).eq("user_id", user.id).single()

  if (!product) {
    redirect("/dashboard/products")
  }

  const { data: productDesign } = await supabase
    .from("product_designs")
    .select(
      `
      *,
      designs(*)
    `,
    )
    .eq("product_id", id)
    .maybeSingle()

  const { data: order } = await supabase.from("orders").select("*").eq("product_id", id).maybeSingle()

  const getStatusBadge = () => {
    switch (product.status) {
      case "approved":
        return { icon: CheckCircle, color: "bg-green-600", text: "Approved" }
      case "rejected":
        return { icon: XCircle, color: "bg-red-600", text: "Rejected" }
      case "under_review":
        return { icon: Clock, color: "bg-blue-600", text: "Under Review" }
      case "pending":
        return { icon: AlertCircle, color: "bg-yellow-600", text: "Pending" }
      default:
        return { icon: Package, color: "bg-gray-600", text: product.status }
    }
  }

  const statusInfo = getStatusBadge()
  const StatusIcon = statusInfo.icon

  return (
    <>
      <DashboardLayout title={product.product_name || "Product"} backHref="/dashboard/products">
        <div className="space-y-8 sm:space-y-10 w-full pb-8 md:pb-12">
          {/* Header */}
          <div className="bg-black text-white w-full py-8 sm:py-10 px-4 md:px-10 lg:px-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                  {product.product_name}
                </h1>
                <p className="text-white/70 mt-2 text-base sm:text-lg capitalize">
                  {product.product_type}
                </p>
              </div>
              <Badge className={`${statusInfo.color} text-white h-10 w-full sm:w-auto flex items-center justify-center text-xs sm:text-sm font-black uppercase px-4 border-2`}>
                <StatusIcon className="h-4 w-4 mr-2" />
                {statusInfo.text}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="w-full px-4 md:px-10 lg:px-16 max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              {/* Product Image */}
              <div>
                <Card className="border-2 border-black/20">
                  <CardContent className="p-0">
                    <DashboardProductImage
                      imageUrl={product.image_url}
                      productName={product.product_name}
                      className="w-full aspect-square object-cover rounded-lg"
                      fallbackClassName="w-full aspect-square bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg flex items-center justify-center"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Product Details */}
              <div className="space-y-6">
                {/* Description */}
                {product.description && (
                  <Card className="border-2 border-black/20">
                    <CardHeader className="bg-black/5">
                      <CardTitle className="text-lg font-black uppercase">Description</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-sm leading-relaxed text-black/70">{product.description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Status Card */}
                <Card className="border-2 border-black/20">
                  <CardHeader className="bg-black/5">
                    <CardTitle className="text-lg font-black uppercase">Status Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {product.status === "pending" && (
                      <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                        <p className="text-sm font-semibold text-yellow-900">
                          Your product is waiting to be reviewed. Choose a design to move forward.
                        </p>
                      </div>
                    )}

                    {product.status === "under_review" && (
                      <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900">
                          Our team is reviewing your product and design. We&apos;ll notify you once it&apos;s approved with pricing.
                        </p>
                      </div>
                    )}

                    {product.status === "approved" && !order && (
                      <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-900">
                          Your product has been approved! Create an order to proceed with payment and production.
                        </p>
                      </div>
                    )}

                    {product.status === "rejected" && (
                      <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                        <p className="text-sm font-semibold text-red-900">
                          Unfortunately, your product couldn&apos;t be approved. Please contact support for more details.
                        </p>
                        {product.admin_notes && (
                          <p className="text-xs text-red-700 mt-2 italic">Note: {product.admin_notes}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Design Information */}
                {productDesign && (
                  <Card className="border-2 border-black/20">
                    <CardHeader className="bg-black/5">
                      <CardTitle className="text-lg font-black uppercase">Design Information</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-2">
                      <p className="text-sm font-semibold">
                        {productDesign.is_custom ? "Custom Design" : productDesign.designs?.name || "Design Selected"}
                      </p>
                      {productDesign.designs?.description && (
                        <p className="text-sm text-muted-foreground">{productDesign.designs.description}</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Ready to Order */}
                {product.status === "approved" && product.price && !order && (
                  <Card className="border-2 border-green-200 bg-green-50">
                    <CardHeader className="bg-green-100">
                      <CardTitle className="text-lg font-black uppercase text-green-900">Ready to Order</CardTitle>
                      <CardDescription className="text-green-700">Create an order to proceed with payment</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Product Price</span>
                          <span className="font-bold text-lg text-green-600">₹{product.price.toFixed(2)}</span>
                        </div>
                        {product.customization_amount && product.customization_amount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Customization Fee</span>
                            <span className="font-bold text-blue-600">₹{product.customization_amount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                      <Button asChild variant="outline" className="w-full h-10 bg-black text-white hover:bg-black/90 border-2 border-black hover:border-black font-black uppercase text-xs sm:text-sm">
                        <Link href={`/dashboard/products/${product.id}/create-order`}>Create Order</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Order Information */}
                {order && (
                  <Card className="border-2 border-black/20">
                    <CardHeader className="bg-black/5">
                      <CardTitle className="text-lg font-black uppercase">Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Amount</span>
                        <span className="font-bold text-lg">₹{order.amount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Payment Status</span>
                        <Badge
                          className={`h-10 w-full sm:w-auto flex items-center justify-center text-xs sm:text-sm font-black uppercase px-4 border-2 ${
                            order.payment_status === "paid"
                              ? "bg-green-600 text-white border-green-700"
                              : "bg-yellow-600 text-white border-yellow-700"
                          }`}
                        >
                          {order.payment_status}
                        </Badge>
                      </div>
                      {order.payment_status !== "paid" && (
                        <Button asChild variant="outline" className="w-full h-10 bg-green-600 hover:bg-green-700 text-white border-2 border-green-600 hover:border-green-700 font-black uppercase text-xs sm:text-sm mt-4">
                          <Link href={`/dashboard/orders/${order.id}/checkout`}>Complete Payment</Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
      <Footer />
    </>
  )
}
