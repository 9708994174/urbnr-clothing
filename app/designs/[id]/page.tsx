import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ShopHeader } from "@/components/shop-header"
import { MobilePageHeader } from "@/components/mobile-page-header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ApplyDesignForm } from "@/components/apply-design-form"
import { SimilarDesigns } from "@/components/similar-designs"

export default async function DesignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: design } = await supabase
    .from("designs")
    .select("*")
    .eq("id", id)
    .single()

  if (!design) redirect("/designs")

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userProducts: any[] = []
  if (user) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    userProducts = data || []
  }

  // Fetch similar designs
  const { data: similarDesigns } = await supabase
    .from("designs")
    .select("*")
    .eq("is_prebuilt", true)
    .eq("category", design.category || "")
    .neq("id", design.id)
    .limit(5)

  return (
    <div className="min-h-screen flex flex-col bg-white w-full overflow-x-hidden">
      <ShopHeader />
      <div className="hidden lg:block h-16"></div> {/* Spacer for fixed header on desktop only */}
      <MobilePageHeader title={design.name || "Design"} backHref="/designs" />

      <main className="flex-1 py-14 w-full pt-20 lg:pt-14 pb-8 md:pb-12">
        <div className="w-full px-4 md:px-10 lg:px-16 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10">

            {/* IMAGE */}
            <div className="border border-black/20">
              <div className="aspect-square bg-neutral-100">
                <img
                  src={design.thumbnail_url || "/placeholder.svg"}
                  alt={design.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* CONTENT */}
            <div className="space-y-8">

              {/* TITLE */}
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
                  {design.name}
                </h1>

                <p className="text-sm uppercase tracking-widest text-black/60 max-w-xl">
                  {design.description}
                </p>

                {design.category && (
                  <span className="inline-block mt-4 border border-black px-3 py-1 text-xs font-black uppercase tracking-widest">
                    {design.category}
                  </span>
                )}
              </div>

              {/* ACTION */}
              {user ? (
                <div className="border border-black/20 p-6">
                  <h3 className="text-lg font-black uppercase mb-4">
                    Apply this Design
                  </h3>

                  <ApplyDesignForm
                    designId={design.id}
                    userProducts={userProducts}
                  />
                </div>
              ) : (
                <div className="border border-black/20 p-6 space-y-4">
                  <h3 className="text-lg font-black uppercase">
                    Sign in to Use
                  </h3>

                  <p className="text-xs uppercase tracking-widest text-black/60">
                    Login or create an account to apply this design
                  </p>

                  <Button
                    asChild
                    className="w-full bg-black text-white font-black uppercase h-11"
                  >
                    <Link href="/auth/signup">Create Account</Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-black font-black uppercase h-11"
                  >
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                </div>
              )}

              {/* DETAILS */}
              <div className="border border-black/20 p-6 space-y-3 text-xs uppercase font-black tracking-widest">
                <div className="flex justify-between">
                  <span className="text-black/50">Type</span>
                  <span>Prebuilt Template</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-black/50">Category</span>
                  <span>{design.category || "General"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-black/50">Template Rate</span>
                  <span className="text-green-600">₹{(design.template_rate || 299).toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-black/50">Customizable</span>
                  <span>Yes</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Similar Designs Section */}
      {similarDesigns && similarDesigns.length > 0 && (
        <SimilarDesigns currentDesignId={design.id} category={design.category || ""} />
      )}

      <Footer />
    </div>
  )
}
