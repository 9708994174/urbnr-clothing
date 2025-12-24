"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, MapPin } from "lucide-react"

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [orderStats, setOrderStats] = useState({ total: 0, paid: 0, totalSpent: 0 })
  const router = useRouter()

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/")
        return
      }

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (data) {
        setProfile(data)
        setFullName(data.full_name || "")
        setEmail(data.email || "")
        setPhone(data.phone || "")
        setAddress(data.address || "")
        setCity(data.city || "")
        setState(data.state || "")
        setZipCode(data.zip_code || "")
      }

      const { data: orders } = await supabase.from("orders").select("*").eq("user_id", user.id)
      if (orders) {
        const paid = orders.filter(o => o.payment_status === "paid")
        setOrderStats({
          total: orders.length,
          paid: paid.length,
          totalSpent: paid.reduce((s, o) => s + (o.amount || 0), 0),
        })
      }

      setIsLoading(false)
    }

    fetchProfile()
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from("profiles").update({
        full_name: fullName,
        phone,
        address,
        city,
        state,
        zip_code: zipCode,
      }).eq("id", user.id)

      setMessage("Profile updated successfully")
    } catch {
      setMessage("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Profile" backHref="/dashboard">
        <div className="flex items-center justify-center min-h-[300px] font-black uppercase">
          Loading…
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Profile" backHref="/dashboard">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* HEADER */}
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            Account Settings
          </h1>
          <p className="uppercase text-xs tracking-widest text-black/60 mt-2">
            Manage your Zylo profile
          </p>
        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: "Total Orders", value: orderStats.total },
            { label: "Completed", value: orderStats.paid },
            { label: "Total Spent", value: `₹${orderStats.totalSpent.toFixed(2)}` },
          ].map((s, i) => (
            <div key={i} className="border border-black/20 p-6 bg-white">
              <p className="text-xs uppercase tracking-widest font-black text-black/60">
                {s.label}
              </p>
              <p className="text-3xl font-black mt-2">{s.value}</p>
            </div>
          ))}
        </div>

        {/* PERSONAL INFO */}
        <Card className="border border-black/20">
          <CardHeader>
            <CardTitle className="uppercase font-black">
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={email} disabled />
                </div>
              </div>

              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} />
              </div>

              {message && (
                <p className="text-xs uppercase font-black tracking-widest">
                  {message}
                </p>
              )}

              <Button className="bg-black text-white font-black uppercase">
                {isSaving ? "Saving…" : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ADDRESS */}
        <Card className="border border-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase font-black">
              <MapPin className="h-5 w-5" /> Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <Input placeholder="Street Address" value={address} onChange={e => setAddress(e.target.value)} />
              <div className="grid md:grid-cols-3 gap-4">
                <Input placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
                <Input placeholder="State" value={state} onChange={e => setState(e.target.value)} />
                <Input placeholder="ZIP" value={zipCode} onChange={e => setZipCode(e.target.value)} />
              </div>
              <Button className="bg-black text-white font-black uppercase">
                Update Address
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ACCOUNT META */}
        <div className="border border-black/20 p-6 bg-white space-y-2">
          <div className="flex justify-between text-sm uppercase font-black">
            <span>Account Type</span>
            <span>{profile?.role === "admin" ? "Administrator" : "Customer"}</span>
          </div>
          <div className="flex justify-between text-sm uppercase font-black">
            <span>Status</span>
            <span className="text-green-600">Active</span>
          </div>
        </div>

        {/* SIGN OUT */}
        <Button
          onClick={handleSignOut}
          className="w-full bg-black text-white font-black uppercase h-12"
        >
          <LogOut className="mr-2 h-5 w-5" />
          Sign Out
        </Button>

      </div>
    </DashboardLayout>
  )
}
