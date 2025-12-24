import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Clock, CheckCircle, Users } from "lucide-react"
import Link from "next/link"
import { requireAdmin } from "@/lib/auth-helpers"
import { ShopHeader } from "@/components/shop-header"
import { Footer } from "@/components/footer"
import { MobilePageHeader } from "@/components/mobile-page-header"

export default async function AdminDashboardPage() {
  await requireAdmin()

  const supabase = await createClient()

  // Statistics
  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })

  const { count: pendingProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  const { count: underReviewProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("status", "under_review")

  const { count: approvedProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved")

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  const { data: recentProducts } = await supabase
    .from("products")
    .select(
      `
      *,
      profiles!products_user_id_fkey(full_name, email)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <>
      <ShopHeader />
      <div className="min-h-screen bg-background w-full overflow-x-hidden">
        <div className="hidden lg:block h-16"></div>
        <MobilePageHeader title="Admin Dashboard" backHref="/" />

        <header className="border-b bg-black text-white w-full pt-16 lg:pt-0">
          <div className="w-full px-4 md:px-10 lg:px-16 py-8 md:py-10">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">ADMIN DASHBOARD</h1>
            <p className="text-base sm:text-lg text-white/70 mt-3 sm:mt-2"> Manage products, users, and platform settings</p>
          </div>
        </header>

        <main className="w-full px-4 md:px-10 lg:px-16 py-8 space-y-8 pb-8 md:pb-12">

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Products
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalProducts || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pendingProducts || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Under Review
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {underReviewProducts || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Approved
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {approvedProducts || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalUsers || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recent Submissions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentProducts?.map((product) => (
                  <Link
                    key={product.id}
                    href={`/admin/products/${product.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg hover:bg-muted/50 transition"
                  >
                    <div className="flex items-center gap-4">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.product_name}
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold">
                          {product.product_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          by{" "}
                          {product.profiles?.full_name ||
                            product.profiles?.email ||
                            "Unknown"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`self-start sm:self-center px-3 py-1 text-xs font-medium rounded-full ${
                        product.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : product.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : product.status === "under_review"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.status.replace("_", " ")}
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link
                  href="/admin/products?status=pending"
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">
                      Review Pending Products
                    </span>
                  </div>
                  <span className="font-bold">
                    {pendingProducts || 0}
                  </span>
                </Link>

                <Link
                  href="/admin/products?status=under_review"
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">
                      Products Under Review
                    </span>
                  </div>
                  <span className="font-bold">
                    {underReviewProducts || 0}
                  </span>
                </Link>

                <Link
                  href="/admin/products"
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">
                      View All Products
                    </span>
                  </div>
                  <span className="font-bold">
                    {totalProducts || 0}
                  </span>
                </Link>

                <Link
                  href="/admin/orders"
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">
                      Manage Orders & Returns
                    </span>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
