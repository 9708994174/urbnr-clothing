import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Package, Upload, Clock, CheckCircle } from "lucide-react"
import { Footer } from "@/components/footer"

export default async function DashboardPage() {
  const supabase = await createClient()

  // 🔓 PUBLIC MODE: try fetching user, but don’t block
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id ?? null

  const { data: profile } = userId
    ? await supabase.from("profiles").select("*").eq("id", userId).single()
    : { data: null }

  const { data: products, count: totalProducts } = userId
    ? await supabase
        .from("products")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
    : { data: [], count: 0 }

  const pendingCount = products?.filter((p) => p.status === "pending").length || 0
  const approvedCount = products?.filter((p) => p.status === "approved").length || 0

  return (
    <>
      <DashboardLayout title="Dashboard" backHref="/">
        <div className="space-y-6 md:space-y-10 w-full pb-8 md:pb-12">
          {/* HERO */}
          <div className="bg-black text-white w-full py-6 md:py-10 px-4 md:px-10 lg:px-16">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
              Welcome, {profile?.full_name || "Guest"}
            </h1>
            <p className="text-white/70 mt-2 text-base sm:text-lg">
              Manage your custom merchandise projects
            </p>
          </div>

          {/* STATS */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 w-full px-4 md:px-10 lg:px-16">
            <div className="bg-white border border-black/20 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest">
                  Total Products
                </h3>
                <Package className="h-5 w-5 text-black/70" />
              </div>
              <div className="text-3xl font-black">{totalProducts || 0}</div>
            </div>

            <div className="bg-white border border-black/20 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest">
                  Pending Review
                </h3>
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="text-3xl font-black text-yellow-600">
                {pendingCount}
              </div>
            </div>

            <div className="bg-white border border-black/20 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest">
                  Approved
                </h3>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-3xl font-black text-green-600">
                {approvedCount}
              </div>
            </div>

            <div className="bg-black text-white p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest">
                  Quick Action
                </h3>
                <Upload className="h-5 w-5" />
              </div>
              <Button
                asChild
                className="w-full bg-white text-black hover:bg-white/90 font-black uppercase h-11"
              >
                <Link href="/dashboard/upload">Upload New</Link>
              </Button>
            </div>
          </div>

          {/* RECENT PRODUCTS */}
          <div className="bg-white border border-black/20 w-full px-4 md:px-10 lg:px-16">
            <div className="border-b border-black/20 px-6 py-4">
              <h2 className="text-2xl font-black uppercase">
                Recent Products
              </h2>
              <p className="text-black/60 mt-1">
                Your latest uploads and their status
              </p>
            </div>

            <div className="p-6">
              {!products || products.length === 0 ? (
                <div className="text-center py-14">
                  <Package className="h-14 w-14 text-black/30 mx-auto mb-4" />
                  <h3 className="text-xl font-black uppercase mb-2">
                    No products yet
                  </h3>
                  <p className="text-black/60 mb-6">
                    Start by uploading your first product
                  </p>
                  <Button
                    asChild
                    className="bg-black text-white hover:bg-black/90 font-black uppercase h-11 px-8"
                  >
                    <Link href="/dashboard/upload">Upload Product</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.slice(0, 5).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between border border-black/20 p-4 hover:border-black transition"
                    >
                      <div className="flex items-center gap-4">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.product_name}
                            className="h-16 w-16 object-cover border border-black/20"
                          />
                        ) : (
                          <div className="h-16 w-16 border border-black/20 bg-neutral-100 flex items-center justify-center">
                            <Package className="h-8 w-8 text-black/30" />
                          </div>
                        )}

                        <div>
                          <h4 className="font-black uppercase text-base">
                            {product.product_name}
                          </h4>
                          <p className="text-xs uppercase tracking-wider text-black/50">
                            {product.product_type}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`h-10 w-full sm:w-auto flex items-center justify-center text-xs sm:text-sm font-black uppercase border-2 px-4 ${
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
                    </div>
                  ))}

                  {products.length > 5 && (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border border-black hover:bg-black hover:text-white font-black uppercase h-11"
                    >
                      <Link href="/dashboard/products">View All Products</Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>

      <Footer />
    </>
  )
}
