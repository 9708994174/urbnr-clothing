import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Truck, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/footer"
import { ReturnExchangeRequest } from "@/components/return-exchange-request"
import { OrderImage } from "@/components/order-image"

export default async function OrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: orders } = user
    ? await supabase
        .from("orders")
        .select(
          `
          *,
          catalog_products:catalog_product_id(id, name, image_url),
          products:product_id(id, product_name, image_url)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
    : { data: null }

  return (
    <>
      <DashboardLayout title="Orders" backHref="/dashboard">
        <div className="space-y-8 sm:space-y-10 w-full pb-8 md:pb-12">
          {/* Header */}
          <div className="bg-black text-white w-full py-8 sm:py-10 px-4 md:px-10 lg:px-16">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                My Orders
              </h1>
              <p className="text-white/70 mt-2 text-base sm:text-lg">
                Track your order history and payments
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="w-full px-4 md:px-10 lg:px-16">

            {/* Not logged in */}
            {!user ? (
              <Card className="border-2 border-black/20">
                <CardContent className="text-center py-16">
                  <Package className="h-16 w-16 text-black/30 mx-auto mb-4" />
                  <h3 className="text-xl font-black uppercase mb-2">
                    Please Login
                  </h3>
                  <p className="text-black/60 mb-6">
                    Login to view your orders
                  </p>
                  <Button asChild className="bg-black text-white hover:bg-black/90 font-black uppercase h-11 px-8">
                    <Link href="/account">Login</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : !orders || orders.length === 0 ? (
              /* No orders */
              <Card className="border-2 border-black/20">
                <CardContent className="text-center py-16">
                  <Package className="h-16 w-16 text-black/30 mx-auto mb-4" />
                  <h3 className="text-xl font-black uppercase mb-2">
                    No orders yet
                  </h3>
                  <p className="text-black/60 mb-6">
                    Once your products are approved, you&apos;ll be able to place orders here
                  </p>
                  <Button asChild className="bg-black text-white hover:bg-black/90 font-black uppercase h-11 px-8">
                    <Link href="/dashboard/products">View My Products</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Orders list */
              <div className="space-y-4 sm:space-y-6">
                {orders.map((order) => (
                  <Card key={order.id} className="border-2 border-black/20 hover:border-black transition-all">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        
                        {/* Left: Product info */}
                        <Link href={`/dashboard/orders/${order.id}`} className="flex gap-4 sm:gap-6 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <OrderImage
                              src={order.catalog_products?.image_url || order.products?.image_url}
                              alt={order.catalog_products?.name || order.products?.product_name || "Product"}
                              className="h-24 w-24 sm:h-32 sm:w-32 object-cover border-2 border-black/20 rounded-lg hover:border-black transition-all"
                              fallbackClassName="h-24 w-24 sm:h-32 sm:w-32 border-2 border-black/20 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0 hover:border-black transition-all"
                            />
                          </div>

                          <div className="space-y-2 flex-1 min-w-0">
                            <h3 className="font-black uppercase text-base sm:text-lg hover:underline">
                              {order.catalog_products?.name || order.products?.product_name || "Product"}
                            </h3>
                            <div className="space-y-1 text-sm">
                              <p className="text-black/60">
                                Order #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                              </p>
                              <p className="text-black/60">
                                {new Date(order.created_at).toLocaleDateString("en-IN", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric"
                                })}
                              </p>
                              {order.tracking_number && (
                                <p className="text-blue-600 font-bold">
                                  <Truck className="h-4 w-4 inline mr-1" />
                                  Tracking: {order.tracking_number}
                                </p>
                              )}
                              {order.shipping_status && (
                                <p className="text-black/60">
                                  Shipping: <span className="font-semibold capitalize">{order.shipping_status.replace("_", " ")}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>

                        {/* Right: Amount + status + action */}
                        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row sm:items-center lg:items-end xl:items-center gap-4 sm:gap-6 border-t lg:border-t-0 lg:border-l border-black/10 pt-4 lg:pt-0 lg:pl-6 lg:pt-0">
                          <div className="sm:text-right lg:text-right">
                            <p className="text-2xl sm:text-3xl font-black mb-2">
                              ₹{order.amount?.toFixed(2) || "0.00"}
                            </p>
                            <span
                              className={`h-10 w-full sm:w-auto flex items-center justify-center text-xs sm:text-sm font-black uppercase border-2 rounded px-4 ${
                                order.payment_status === "paid"
                                  ? "border-green-600 text-green-600 bg-green-50"
                                  : order.payment_status === "pending"
                                  ? "border-yellow-600 text-yellow-600 bg-yellow-50"
                                  : "border-red-600 text-red-600 bg-red-50"
                              }`}
                            >
                              {order.payment_status}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2 sm:w-auto w-full">
                            <Button
                              asChild
                              variant="outline"
                              className="border-2 border-black hover:bg-black hover:text-white font-black uppercase h-11 w-full sm:w-auto"
                            >
                              <Link href={`/dashboard/orders/${order.id}`}>
                                View Details
                              </Link>
                            </Button>
                            {order.payment_status === "pending" && (
                              <Button
                                asChild
                                className="bg-green-600 hover:bg-green-700 text-white font-black uppercase h-11 w-full sm:w-auto"
                              >
                                <Link href={`/dashboard/orders/${order.id}/checkout`}>
                                  Pay Now
                                </Link>
                              </Button>
                            )}
                            {order.payment_status === "paid" && 
                             order.order_status !== "returned" && 
                             order.order_status !== "exchanged" && 
                             order.order_status !== "cancelled" && (
                              <div className="w-full sm:w-auto">
                                <ReturnExchangeRequest
                                  orderId={order.id}
                                  productId={order.catalog_product_id || order.product_id}
                                  productName={order.catalog_products?.name || order.products?.product_name || "Product"}
                                  orderDate={order.created_at}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
      <Footer />
    </>
  )
}
