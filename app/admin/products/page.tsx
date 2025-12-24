import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Package, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { requireAdmin } from "@/lib/auth-helpers"
import { ShopHeader } from "@/components/shop-header"
import { Footer } from "@/components/footer"
import { AdminProductActions } from "@/components/admin-product-actions"
import { AdminProductImage } from "@/components/admin-product-image"
import { MobilePageHeader } from "@/components/mobile-page-header"

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  await requireAdmin()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  const { data: allProducts } = await supabase
    .from("products")
    .select(
      `
      *,
      profiles!products_user_id_fkey(full_name, email)
    `,
    )
    .order("created_at", { ascending: false })

  const pendingProducts = allProducts?.filter((p) => p.status === "pending") || []
  const underReviewProducts = allProducts?.filter((p) => p.status === "under_review") || []
  const approvedProducts = allProducts?.filter((p) => p.status === "approved") || []
  const rejectedProducts = allProducts?.filter((p) => p.status === "rejected") || []

  const ProductCard = ({ product }: { product: any }) => (
    <Card className="hover:shadow-lg transition-all border-2 border-black/10 hover:border-black/20 bg-white">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Product Image */}
          <AdminProductImage
            imageUrl={product.image_url}
            productName={product.product_name}
          />

          {/* Product Info */}
          <div className="flex-1 space-y-3 min-w-0">
            {/* Title and Basic Info */}
            <div className="space-y-2">
              <h3 className="font-black uppercase text-base sm:text-lg lg:text-xl tracking-tight leading-tight">
                {product.product_name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <p className="text-xs sm:text-sm text-muted-foreground capitalize font-semibold">
                  {product.product_type}
                </p>
                <span className="text-black/20">•</span>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  by <span className="font-semibold text-black">{product.profiles?.full_name || product.profiles?.email || "Unknown"}</span>
                </p>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Pricing Info */}
            {(product.price || (product.customization_amount && product.customization_amount > 0)) && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {product.price && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Price:</span>
                    <span className="font-black text-green-600 text-base">₹{Number(product.price).toFixed(2)}</span>
                  </div>
                )}
                {product.customization_amount && product.customization_amount > 0 && (
                  <>
                    {product.price && <span className="text-black/20">•</span>}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Customization:</span>
                      <span className="font-black text-blue-600 text-base">₹{Number(product.customization_amount).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Admin Notes */}
            {product.admin_notes && (
              <div className="pt-2 border-t border-black/10">
                <p className="text-xs text-muted-foreground italic line-clamp-2">
                  <span className="font-bold not-italic">Note:</span> {product.admin_notes}
                </p>
              </div>
            )}

            {/* Status and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t-2 border-black/10">
              <Badge
                className={`h-10 w-full sm:w-auto flex items-center justify-center text-xs sm:text-sm font-black uppercase px-4 border-2 ${
                  product.status === "approved"
                    ? "bg-green-500 text-white border-green-600"
                    : product.status === "pending"
                      ? "bg-yellow-500 text-white border-yellow-600"
                      : product.status === "under_review"
                        ? "bg-blue-500 text-white border-blue-600"
                        : product.status === "completed"
                          ? "bg-purple-500 text-white border-purple-600"
                          : "bg-red-500 text-white border-red-600"
                }`}
              >
                {product.status.replace("_", " ")}
              </Badge>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {product.status !== "approved" && product.status !== "rejected" && (
                  <AdminProductActions 
                    productId={product.id} 
                    currentStatus={product.status}
                  />
                )}
                <Button 
                  variant="outline" 
                  className="font-black uppercase text-xs sm:text-sm border-2 border-black hover:bg-black hover:text-white transition-colors h-10 w-full sm:w-auto" 
                  asChild
                >
                  <Link href={`/admin/products/${product.id}`}>View Details</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        </CardContent>
      </Card>
    )

  // Double-check admin status before rendering
  if (!profile || profile.role !== "admin") {
    return (
      <>
        <ShopHeader />
        <div className="min-h-screen bg-background w-full overflow-x-hidden">
          <div className="h-16"></div>
          <div className="flex items-center justify-center h-[60vh]">
            <Card className="max-w-md">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black uppercase mb-2">Access Denied</h2>
                <p className="text-muted-foreground mb-4">
                  You need admin privileges to access this page.
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Current role: <strong>{profile?.role || "Not found"}</strong>
                </p>
                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full h-10 border-2 border-black hover:bg-black hover:text-white font-black uppercase text-xs sm:text-sm">
                    <Link href="/admin/setup">Set As Admin</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full h-10 border-2 border-black hover:bg-black hover:text-white font-black uppercase text-xs sm:text-sm">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Or set your role in Supabase: <code className="bg-muted px-1 rounded">UPDATE profiles SET role = 'admin' WHERE email = 'your-email'</code>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <ShopHeader />
      <div className="min-h-screen bg-background w-full overflow-x-hidden">
        <div className="hidden lg:block h-16"></div> {/* Spacer for fixed header on desktop only */}
        <MobilePageHeader title="Products" backHref="/admin" />
        <header className="border-b bg-black text-white w-full pt-16 lg:pt-0">
          <div className="w-full px-4 md:px-10 lg:px-16 py-10 md:py-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">Product Management</h1>
                <p className="text-lg sm:text-xl text-white/70 mt-4 sm:mt-3">Review and manage customer product submissions</p>
              </div>
            </div>
          </div>
        </header>

        <main className="w-full px-4 md:px-10 lg:px-16 py-6 md:py-8 pt-20 lg:pt-6 pb-8 md:pb-12">

          {/* Summary Cards - Clickable */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Link href="/admin/products?status=all" className="block">
              <Card className="border-2 border-black/20 hover:border-black transition-all cursor-pointer h-full">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="text-xs sm:text-sm text-muted-foreground uppercase font-black mb-1 sm:mb-2 tracking-wider">All</div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-black">({allProducts?.length || 0})</div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/products?status=pending" className="block">
              <Card className="border-2 border-yellow-500 hover:border-yellow-600 hover:shadow-lg transition-all cursor-pointer h-full bg-yellow-50">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="text-xs sm:text-sm text-yellow-600 uppercase font-black mb-1 sm:mb-2 tracking-wider">Pending</div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-black text-yellow-600">({pendingProducts.length})</div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/products?status=approved" className="block">
              <Card className="border-2 border-green-500 hover:border-green-600 hover:shadow-lg transition-all cursor-pointer h-full bg-green-50">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="text-xs sm:text-sm text-green-600 uppercase font-black mb-1 sm:mb-2 tracking-wider">Approved</div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-black text-green-600">({approvedProducts.length})</div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/products?status=rejected" className="block">
              <Card className="border-2 border-gray-500 hover:border-gray-600 hover:shadow-lg transition-all cursor-pointer h-full bg-gray-50">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="text-xs sm:text-sm text-gray-600 uppercase font-black mb-1 sm:mb-2 tracking-wider">Rejected</div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-black text-gray-600">({rejectedProducts.length})</div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Products List */}
          <div className="space-y-4">
            {(() => {
              const status = params.status || "all"
              let productsToShow: any[] = []
              
              if (status === "all") {
                productsToShow = allProducts || []
              } else if (status === "pending") {
                productsToShow = pendingProducts
              } else if (status === "approved") {
                productsToShow = approvedProducts
              } else if (status === "rejected") {
                productsToShow = rejectedProducts
              }

              if (productsToShow.length === 0) {
                return (
                  <Card className="border-2 border-black/20">
                    <CardContent className="text-center py-16">
                      <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-black uppercase mb-2 tracking-tight">
                        {status === "all" ? "No Products Found" : 
                         status === "pending" ? "No Pending Products" :
                         status === "approved" ? "No Approved Products" :
                         "No Rejected Products"}
                      </h3>
                      <p className="text-muted-foreground">
                        {status === "all" ? "Products will appear here once users start uploading" :
                         status === "pending" ? "All products have been processed" :
                         status === "approved" ? "Approved products will appear here" :
                         "Rejected products will appear here"}
                      </p>
                    </CardContent>
                  </Card>
                )
              }

              return productsToShow.map((product) => <ProductCard key={product.id} product={product} />)
            })()}
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
