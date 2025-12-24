"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { ShopHeader } from "@/components/shop-header"
import { Footer } from "@/components/footer"
import { MobilePageHeader } from "@/components/mobile-page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Package, Heart, Settings, LogOut, Loader2, Sparkles, ShieldCheck, Truck, Calendar, X, RefreshCw, PackageX, Eye } from "lucide-react"
import { getProfile, updateProfile, getOrders } from "@/lib/actions/profile-actions"
import { signOut } from "@/lib/actions/auth-actions"
import { cancelOrder } from "@/lib/actions/order-actions"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ReturnExchangeRequest } from "@/components/return-exchange-request"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function AccountPage() {
  const [profile, setProfile] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
  })
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const defaultTab = searchParams.get("tab") || "profile"

  const stats = useMemo(() => {
    const orderCount = orders.length
    const paidOrders = orders.filter((o) => o.payment_status === "paid").length
    const totalSpent = orders
      .filter((o) => o.payment_status === "paid")
      .reduce((sum, o) => sum + (o.amount || 0), 0)
    return [
      { label: "Total Orders", value: orderCount.toString() },
      { label: "Completed", value: paidOrders.toString() },
      { label: "Total Spent", value: `₹${totalSpent.toFixed(0)}` },
      { label: "Wishlist", value: "—", href: "/wishlist" },
    ]
  }, [orders])

  useEffect(() => {
    loadData()
    
    // Check if we need to redirect to a specific order
    const orderId = searchParams.get("order")
    if (orderId) {
      setTimeout(() => {
        router.push(`/account/orders/${orderId}`)
      }, 500)
    }
  }, [searchParams, router])

  const loadData = async () => {
    const profileResult = await getProfile()
    const ordersResult = await getOrders()

    if (profileResult.success && profileResult.profile) {
      setProfile(profileResult.profile)
      setFormData({
        full_name: profileResult.profile.full_name || "",
        phone: profileResult.profile.phone || "",
        address: profileResult.profile.address || "",
        city: profileResult.profile.city || "",
        state: profileResult.profile.state || "",
        zip_code: profileResult.profile.zip_code || "",
      })
    }

    if (ordersResult.success && ordersResult.orders) {
      setOrders(ordersResult.orders)
    }

    setLoading(false)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const result = await updateProfile(formData)
    if (result.success) {
      toast({
        title: "Success!",
        description: result.message || "Profile updated successfully",
      })
      await loadData()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update profile",
        variant: "destructive",
      })
    }

    setSaving(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!cancelReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for cancellation",
        variant: "destructive",
      })
      return
    }

    setCancellingOrderId(orderId)
    const result = await cancelOrder(orderId, cancelReason)
    
    if (result.success) {
      toast({
        title: "Order cancelled",
        description: result.message || "Your order has been cancelled successfully",
      })
      setCancelDialogOpen(false)
      setCancelReason("")
      await loadData()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to cancel order",
        variant: "destructive",
      })
    }
    setCancellingOrderId(null)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "confirmed":
      case "delivered":
        return "bg-green-100 text-green-800 border-green-300"
      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "shipped":
      case "in_transit":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "cancelled":
      case "rejected":
      case "returned":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden">
        <ShopHeader />
        <div className="hidden lg:block h-16"></div> {/* Spacer for fixed header on desktop only */}
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <ShopHeader />
      <div className="hidden lg:block h-16"></div> {/* Spacer for fixed header on desktop only */}
      <MobilePageHeader title="Account" backHref="/" />

      <main className="w-full px-4 md:px-10 lg:px-16 py-6 md:py-10 pt-20 lg:pt-6 pb-8 md:pb-12">
        {/* Hero */}
        <div className="bg-white border border-black/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black uppercase">Welcome back!</h1>
            <p className="text-sm md:text-base text-black/60 max-w-2xl">
              Manage your profile, track orders, and keep your details up to date. Quick access to wishlist and settings in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/designs">
              <Button className="font-black uppercase h-11 px-5" variant="outline">
                Start Designing
              </Button>
            </Link>
            <Button variant="outline" onClick={handleSignOut} className="font-bold uppercase bg-transparent">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats + shortcuts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {stats.map((item) => (
            <Link key={item.label} href={item.href || "#"} className={!item.href ? "pointer-events-none" : ""}>
              <Card className="border border-black/10 hover:border-black transition">
                <CardContent className="p-4">
                  <p className="text-xs font-black uppercase text-black/50 mb-1">{item.label}</p>
                  <p className="text-2xl font-black">{item.value}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
          <Card className="border border-black/10">
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-black" />
              <div>
                <p className="text-xs font-black uppercase text-black/50">Profile</p>
                <p className="font-bold">{formData.full_name || "Add your name"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6 mt-10">
          <TabsList className="grid w-full grid-cols-2 md:flex md:w-auto bg-white border border-black/10 rounded-lg p-2.5 md:p-1 gap-2.5 md:gap-1 h-auto">
            <TabsTrigger value="profile" className="uppercase font-bold py-3.5 md:py-2 px-3 md:px-3 text-xs md:text-sm whitespace-nowrap h-auto min-h-[48px] md:min-h-0 flex items-center justify-center">
              <User className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="uppercase font-bold py-3.5 md:py-2 px-3 md:px-3 text-xs md:text-sm whitespace-nowrap h-auto min-h-[48px] md:min-h-0 flex items-center justify-center">
              <Package className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="uppercase font-bold py-3.5 md:py-2 px-3 md:px-3 text-xs md:text-sm whitespace-nowrap h-auto min-h-[48px] md:min-h-0 flex items-center justify-center">
              <Heart className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span>Wishlist</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="uppercase font-bold py-3.5 md:py-2 px-3 md:px-3 text-xs md:text-sm whitespace-nowrap h-auto min-h-[48px] md:min-h-0 flex items-center justify-center">
              <Settings className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border border-black/10">
              <CardHeader>
                <CardTitle className="uppercase font-black">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number</label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 9999999999"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input value={profile?.email || ""} disabled className="bg-gray-100" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">City</label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">State</label>
                      <Input
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">ZIP Code</label>
                      <Input
                        value={formData.zip_code}
                        onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                        placeholder="ZIP"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" className="font-bold uppercase" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black uppercase">My Orders</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track and manage all your orders in one place
                  </p>
                </div>
                <Link href="/shop">
                  <Button variant="outline" className="font-bold uppercase">
                    Continue Shopping
                  </Button>
                </Link>
              </div>

              {orders.length === 0 ? (
                <Card className="border-2 border-black/10">
                  <CardContent className="text-center py-16">
                    <Package className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-black uppercase mb-2">No orders yet</h3>
                    <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
                    <Link href="/shop">
                      <Button className="font-black uppercase bg-black hover:bg-black/90 text-white h-12 px-8">
                        Start Shopping
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const product = order.catalog_products || order.products
                    const productName = order.catalog_products?.name || order.products?.product_name || "Product"
                    const productImage = order.catalog_products?.image_url || order.products?.image_url || "/placeholder.svg"
                    // Cancel is allowed only if order hasn't been shipped OR order is delivered
                    const shippingStatus = order.shipping_status || "pending"
                    const isShipped = shippingStatus === "shipped" || 
                                      shippingStatus === "in_transit" || 
                                      shippingStatus === "out_for_delivery" || 
                                      shippingStatus === "preparing"
                    const isDelivered = shippingStatus === "delivered" || order.order_status === "delivered"
                    
                    const canCancel = 
                      order.payment_status === "paid" &&
                      order.order_status !== "cancelled" &&
                      order.order_status !== "returned" &&
                      order.order_status !== "exchanged" &&
                      (!isShipped || isDelivered) // Can cancel if not shipped, or if delivered
                    // Return/Exchange is allowed only if order hasn't been shipped (including after delivery)
                    const canReturnExchange = 
                      order.payment_status === "paid" && 
                      order.order_status !== "cancelled" && 
                      order.order_status !== "returned" && 
                      order.order_status !== "exchanged" &&
                      shippingStatus !== "shipped" &&
                      shippingStatus !== "in_transit" &&
                      shippingStatus !== "out_for_delivery" &&
                      shippingStatus !== "preparing" &&
                      shippingStatus !== "delivered" &&
                      order.order_status !== "delivered"

                    return (
                      <Card key={order.id} className="border-2 border-black/10 hover:border-black/20 transition-all">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row gap-6">
                            {/* Product Image */}
                            <Link href={`/account/orders/${order.id}`} className="flex-shrink-0">
                              <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden border-2 border-black/10">
                                <img
                                  src={productImage}
                                  alt={productName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </Link>

                            {/* Order Details */}
                            <div className="flex-1 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div className="flex-1">
                                  <Link href={`/account/orders/${order.id}`}>
                                    <h3 className="text-xl font-black uppercase hover:underline mb-2">
                                      {productName}
                                    </h3>
                                  </Link>
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    <p>
                                      <span className="font-bold">Order #:</span> {order.order_number || order.id.slice(0, 8).toUpperCase()}
                                    </p>
                                    <p>
                                      <Calendar className="h-3 w-3 inline mr-1" />
                                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </p>
                                    {(order.size || order.color) && (
                                      <p>
                                        {order.size && <span>Size: {order.size}</span>}
                                        {order.size && order.color && <span> • </span>}
                                        {order.color && <span>Color: {order.color}</span>}
                                      </p>
                                    )}
                                    <p>
                                      <span className="font-bold">Quantity:</span> {order.quantity || 1}
                                    </p>
                                    {order.tracking_number && (
                                      <p className="text-blue-600 font-bold">
                                        <Truck className="h-3 w-3 inline mr-1" />
                                        Tracking: {order.tracking_number}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Status & Amount */}
                                <div className="text-right space-y-2">
                                  <p className="text-2xl font-black">₹{(order.amount || 0).toFixed(2)}</p>
                                  <div className="flex flex-wrap gap-2 justify-end">
                                    <Badge className={`${getStatusColor(order.payment_status || "pending")} h-10 w-full sm:w-auto flex items-center justify-center text-xs sm:text-sm font-black uppercase px-4 border-2`}>
                                      {order.payment_status || "pending"}
                                    </Badge>
                                    {order.order_status && (
                                      <Badge className={`${getStatusColor(order.order_status)} h-10 w-full sm:w-auto flex items-center justify-center text-xs sm:text-sm font-black uppercase px-4 border-2`}>
                                        {order.order_status.replace("_", " ")}
                                      </Badge>
                                    )}
                                    {order.shipping_status && order.shipping_status !== "pending" && (
                                      <Badge className={`${getStatusColor(order.shipping_status)} h-10 w-full sm:w-auto flex items-center justify-center text-xs sm:text-sm font-black uppercase px-4 border-2`}>
                                        {order.shipping_status.replace("_", " ")}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex flex-wrap gap-3 pt-4 border-t border-black/10">
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="font-bold uppercase border-2"
                                >
                                  <Link href={`/account/orders/${order.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Link>
                                </Button>

                                {canReturnExchange && (
                                  <ReturnExchangeRequest
                                    orderId={order.id}
                                    productId={order.catalog_product_id || order.product_id || ""}
                                    productName={productName}
                                    orderDate={order.created_at}
                                    onSuccess={loadData}
                                  />
                                )}

                                {canCancel && (
                                  <Dialog open={cancelDialogOpen && cancellingOrderId === order.id} onOpenChange={(open) => {
                                    setCancelDialogOpen(open)
                                    if (!open) {
                                      setCancelReason("")
                                      setCancellingOrderId(null)
                                    }
                                  }}>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="font-bold uppercase border-2 border-red-300 text-red-600 hover:bg-red-50"
                                        onClick={() => {
                                          setCancellingOrderId(order.id)
                                          setCancelDialogOpen(true)
                                        }}
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel Order
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle className="text-xl font-black uppercase">Cancel Order</DialogTitle>
                                        <DialogDescription>
                                          Are you sure you want to cancel this order? This action cannot be undone.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4 py-4">
                                        <div>
                                          <Label className="text-sm font-bold uppercase">Reason for Cancellation *</Label>
                                          <Textarea
                                            value={cancelReason}
                                            onChange={(e) => setCancelReason(e.target.value)}
                                            placeholder="Please provide a reason for cancelling this order..."
                                            className="mt-2 min-h-[100px]"
                                          />
                                        </div>
                                        <div className="flex gap-3">
                                          <Button
                                            variant="outline"
                                            onClick={() => {
                                              setCancelDialogOpen(false)
                                              setCancelReason("")
                                              setCancellingOrderId(null)
                                            }}
                                            className="flex-1 font-bold uppercase"
                                          >
                                            Keep Order
                                          </Button>
                                          <Button
                                            onClick={() => handleCancelOrder(order.id)}
                                            disabled={cancellingOrderId === order.id}
                                            className="flex-1 font-black uppercase bg-red-600 hover:bg-red-700 text-white"
                                          >
                                            {cancellingOrderId === order.id ? "Cancelling..." : "Confirm Cancellation"}
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}

                                {order.payment_status === "pending" && (
                                  <Button
                                    asChild
                                    size="sm"
                                    className="font-black uppercase bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Link href={`/dashboard/orders/${order.id}/checkout`}>
                                      Pay Now
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="wishlist">
            <Card className="border border-black/10">
              <CardHeader>
                <CardTitle className="uppercase font-black">My Wishlist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-4">View your saved items</p>
                  <Link href="/wishlist">
                    <Button className="font-bold uppercase">Go to Wishlist</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <Card className="border-2 border-black/10">
                <CardHeader>
                  <CardTitle className="uppercase font-black">Account Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-bold mb-2 uppercase">Email Notifications</h3>
                    <p className="text-sm text-gray-600 mb-4">Manage your email notification preferences</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-black/10 rounded-lg">
                        <div>
                          <p className="font-semibold">Order Updates</p>
                          <p className="text-sm text-muted-foreground">Get notified about order status changes</p>
                        </div>
                        <Button variant="outline" size="sm" className="font-bold uppercase">
                          Enabled
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-black/10 rounded-lg">
                        <div>
                          <p className="font-semibold">Promotional Emails</p>
                          <p className="text-sm text-muted-foreground">Receive offers and new product announcements</p>
                        </div>
                        <Button variant="outline" size="sm" className="font-bold uppercase">
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-6">
                    <h3 className="font-bold mb-2 uppercase">Privacy & Security</h3>
                    <p className="text-sm text-gray-600 mb-4">Manage your account security settings</p>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start font-bold uppercase">
                        Change Password
                      </Button>
                      <Button variant="outline" className="w-full justify-start font-bold uppercase">
                        Two-Factor Authentication
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-200">
                <CardHeader>
                  <CardTitle className="uppercase font-black text-red-600">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-bold mb-2 text-red-600">Delete Account</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <Button variant="destructive" className="font-bold uppercase">
                      Delete My Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  )
}
