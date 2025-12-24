import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Package, Plus } from "lucide-react"
import { requireAuth } from "@/lib/auth-helpers"
import { DashboardProductImage } from "@/components/dashboard-product-image"

export default async function MyProductsPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: allProducts } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Get orders for all products
  const productIds = allProducts?.map((p) => p.id) || []
  const { data: orders } = productIds.length > 0
    ? await supabase
        .from("orders")
        .select("id, product_id, payment_status, amount, order_type")
        .in("product_id", productIds)
    : { data: [] }

  // Create a map of product_id to order
  const orderMap = new Map(orders?.map((o) => [o.product_id, o]) || [])

  const pendingProducts = allProducts?.filter((p) => p.status === "pending") || []
  const approvedProducts = allProducts?.filter((p) => p.status === "approved") || []
  const rejectedProducts = allProducts?.filter((p) => p.status === "rejected") || []

  const ProductCard = ({ product }: { product: any }) => {
    const order = orderMap.get(product.id)
    return (
    <Card className="border-2 border-black/10 hover:border-black/20 transition-all bg-white">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <DashboardProductImage
              imageUrl={product.image_url}
              productName={product.product_name}
            />
          </div>

          {/* Product Info */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div className="space-y-2">
              <div>
                <h3 className="font-black uppercase text-lg sm:text-xl mb-1">
                  {product.product_name}
                </h3>
                <p className="text-xs sm:text-sm uppercase tracking-wider text-black/50">
                  {product.product_type}
                </p>
              </div>
              
              {product.description && (
                <p className="text-sm text-black/60 line-clamp-2">
                  {product.description}
                </p>
              )}

              {/* Pricing Info */}
              {product.status === "approved" && (
                <div className="pt-2 space-y-1">
                  {product.price && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Product Price:</span>
                      <span className="text-sm font-bold text-green-600">₹{product.price.toFixed(2)}</span>
                    </div>
                  )}
                  {product.customization_amount && product.customization_amount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Customization Fee:</span>
                      <span className="text-sm font-bold text-blue-600">₹{product.customization_amount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {product.admin_notes && (
                <div className="pt-2 border-t border-black/10">
                  <p className="text-xs text-black/50 italic">
                    <span className="font-bold">Admin Notes:</span> {product.admin_notes}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-4 border-t-2 border-black/10">
              <span
                className={`h-10 w-full sm:w-auto flex items-center justify-center text-xs sm:text-sm font-black uppercase border-2 rounded px-4 ${
                  product.status === "approved"
                    ? "border-green-600 text-green-600 bg-green-50"
                    : product.status === "pending"
                    ? "border-yellow-600 text-yellow-600 bg-yellow-50"
                    : product.status === "under_review"
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : product.status === "completed"
                      ? "border-purple-600 text-purple-600 bg-purple-50"
                      : "border-red-600 text-red-600 bg-red-50"
                }`}
              >
                {product.status.replace("_", " ")}
              </span>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {order && order.payment_status === "pending" && (
                  <Button asChild variant="outline" className="bg-green-600 hover:bg-green-700 text-white border-2 border-green-600 hover:border-green-700 font-black uppercase text-xs sm:text-sm h-10 w-full sm:w-auto">
                    <Link href={`/dashboard/orders/${order.id}/checkout`}>
                      Pay ₹{order.amount?.toFixed(2)}
                    </Link>
                  </Button>
                )}
                {!order && product.status === "approved" && product.price && (
                  <Button asChild variant="outline" className="bg-green-600 hover:bg-green-700 text-white border-2 border-green-600 hover:border-green-700 font-black uppercase text-xs sm:text-sm h-10 w-full sm:w-auto">
                    <Link href={`/dashboard/products/${product.id}/create-order`}>
                      Pay ₹{product.price.toFixed(2)}
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" className="border-2 border-black hover:bg-black hover:text-white font-black uppercase text-xs sm:text-sm h-10 w-full sm:w-auto">
                  <Link href={`/dashboard/products/${product.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    )
  }

  return (
    <>
      <DashboardLayout title="Products" backHref="/dashboard">
        <div className="space-y-8 sm:space-y-10 w-full pb-8 md:pb-12">

          {/* HEADER */}
          <div className="bg-black text-white w-full py-8 sm:py-10 px-4 md:px-10 lg:px-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                  My Products
                </h1>
                <p className="text-white/70 mt-2 text-base sm:text-lg">
                  Manage all your uploaded products
                </p>
              </div>

              <Button
                asChild
                className="h-11 px-6 bg-white text-black hover:bg-white/90 font-black uppercase w-full sm:w-auto"
              >
                <Link href="/dashboard/upload">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload New
                </Link>
              </Button>
            </div>
          </div>

          {/* TABS */}
          <div className="w-full px-4 md:px-10 lg:px-16">
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="bg-transparent p-0 flex flex-wrap gap-2 w-full mb-10 sm:mb-12">
                {[
                  ["all", allProducts?.length || 0],
                  ["pending", pendingProducts.length],
                  ["approved", approvedProducts.length],
                  ["rejected", rejectedProducts.length],
                ].map(([key, count]) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="
                      uppercase text-xs sm:text-sm font-black tracking-widest
                      border-2 border-black px-4 sm:px-5 py-2
                      data-[state=active]:bg-black
                      data-[state=active]:text-white
                      flex-1 sm:flex-none
                    "
                  >
                    {key} ({count})
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="space-y-4 sm:space-y-6 mt-0">
                {!allProducts || allProducts.length === 0 ? (
                  <div className="border-2 border-dashed border-black/30 rounded-lg py-16 text-center bg-neutral-50">
                    <Package className="h-16 w-16 text-black/30 mx-auto mb-4" />
                    <h3 className="text-xl font-black uppercase text-black/70 mb-2">
                      No products yet
                    </h3>
                    <p className="text-sm text-black/50 mb-6">
                      Start by uploading your first product
                    </p>
                    <Button asChild className="bg-black text-white hover:bg-black/90 font-black uppercase">
                      <Link href="/dashboard/upload">Upload Product</Link>
                    </Button>
                  </div>
                ) : (
                  allProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4 sm:space-y-6 mt-0">
                {pendingProducts.length === 0 ? (
                  <div className="border-2 border-dashed border-black/30 rounded-lg py-16 text-center bg-neutral-50">
                    <Package className="h-16 w-16 text-black/30 mx-auto mb-4" />
                    <p className="text-lg font-black uppercase text-black/50">
                      No pending products
                    </p>
                  </div>
                ) : (
                  pendingProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="approved" className="space-y-4 sm:space-y-6 mt-0">
                {approvedProducts.length === 0 ? (
                  <div className="border-2 border-dashed border-black/30 rounded-lg py-16 text-center bg-neutral-50">
                    <Package className="h-16 w-16 text-black/30 mx-auto mb-4" />
                    <p className="text-lg font-black uppercase text-black/50">
                      No approved products
                    </p>
                  </div>
                ) : (
                  approvedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="rejected" className="space-y-4 sm:space-y-6 mt-0">
                {rejectedProducts.length === 0 ? (
                  <div className="border-2 border-dashed border-black/30 rounded-lg py-16 text-center bg-neutral-50">
                    <Package className="h-16 w-16 text-black/30 mx-auto mb-4" />
                    <p className="text-lg font-black uppercase text-black/50">
                      No rejected products
                    </p>
                  </div>
                ) : (
                  rejectedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DashboardLayout>

      {/* FOOTER */}
      <Footer />
    </>
  )
}
