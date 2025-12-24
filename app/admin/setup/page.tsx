"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Loader2, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DashboardNav } from "@/components/dashboard-nav"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { setAdminRole } from "@/lib/actions/admin-setup-actions"

export default function AdminSetupPage() {
  const [email, setEmail] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUserEmail(user.email || "")
        setEmail(user.email || "")
        setUserId(user.id)
      }
    }
    loadUser()
  }, [])

  const handleSetAdmin = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const result = await setAdminRole(email.trim())

      if (result.success) {
        setResult({
          success: true,
          message: "Admin role set successfully! Redirecting to admin panel...",
        })

        toast({
          title: "Success",
          description: "You are now an admin. Redirecting...",
        })

        setTimeout(() => {
          window.location.href = "/admin/products"
        }, 2000)
      } else {
        setResult({
          success: false,
          message: result.error || "Failed to set admin role",
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `Error: ${error.message || "Something went wrong"}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const copySqlCommand = () => {
    if (!userId) return
    const sql = `UPDATE public.profiles SET role = 'admin' WHERE id = '${userId}';`
    navigator.clipboard.writeText(sql)
    toast({
      title: "SQL Copied",
      description: "Paste this in Supabase SQL Editor",
    })
  }

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-background w-full overflow-x-hidden">
        <div className="h-16"></div>
        <div className="flex items-center justify-center min-h-[80vh] px-4 pb-8 md:pb-12">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl font-black uppercase">Admin Setup</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Set your account as admin to access product management
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Your Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  {userEmail ? `Logged in as: ${userEmail}` : "Enter the email address you used to sign up"}
                </p>
              </div>

              {userId && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs font-bold uppercase mb-2">Alternative: Use SQL (Recommended)</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-background p-2 rounded overflow-x-auto">
                      UPDATE public.profiles SET role = 'admin' WHERE id = '{userId}';
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copySqlCommand}
                      className="flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Copy this SQL and run it in Supabase SQL Editor (more reliable)
                  </p>
                </div>
              )}

              {result && (
                <div
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <p className="text-sm font-medium">{result.message}</p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSetAdmin}
                disabled={loading || !email.trim()}
                className="w-full font-black uppercase"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting Admin Role...
                  </>
                ) : (
                  "Set As Admin"
                )}
              </Button>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">
                  <strong>Note:</strong> You must be logged in to set admin role. If you're not logged in,{" "}
                  <Link href="/auth/login" className="underline hover:no-underline">
                    login first
                  </Link>
                  .
                </p>
                <p className="text-xs text-muted-foreground">
                  Alternatively, you can set admin role directly in Supabase SQL Editor using the script in{" "}
                  <code className="bg-muted px-1 rounded">scripts/026_set_user_as_admin.sql</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  )
}

