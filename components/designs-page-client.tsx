"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ShopHeader } from "@/components/shop-header"
import { Footer } from "@/components/footer"
import { MobilePageHeader } from "@/components/mobile-page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Palette, LayoutDashboard, FileText, ShieldCheck } from "lucide-react"
import { AuthModal } from "@/components/auth-modal"
import type { User } from "@supabase/supabase-js"

type Design = {
  id: string
  name: string
  description: string | null
  category: string | null
  thumbnail_url: string | null
}

export function DesignsPageClient({ initialDesigns }: { initialDesigns: Design[] }) {
  const [user, setUser] = useState<User | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [designs, setDesigns] = useState(initialDesigns)
  const [page, setPage] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialDesigns.length === 15)

  useEffect(() => {
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (!user) {
        setAuthOpen(true)
      }
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (!session?.user) {
          setAuthOpen(true)
        }
      }
    )

    return () => subscription.subscription.unsubscribe()
  }, [])

  const categories = [
    "all",
    "logos",
    "typography",
    "patterns",
    "nature",
    "geometric",
  ]

  const filterByCategory = (category: string) => {
    if (!designs) return []
    if (category === "all") return designs
    return designs.filter((d) => d.category === category)
  }

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      const supabase = createClient()
      const pageSize = 15
      const from = (page + 1) * pageSize
      const to = from + pageSize - 1

      const { data, error } = await supabase
        .from("designs")
        .select("*")
        .eq("is_prebuilt", true)
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) {
        console.error("Error loading more designs:", error)
        return
      }

      const newDesigns = data || []
      setDesigns((prev) => [...prev, ...newDesigns])
      setPage((prev) => prev + 1)
      if (newDesigns.length < pageSize) {
        setHasMore(false)
      }
    } finally {
      setLoadingMore(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-white w-full overflow-x-hidden">
        <ShopHeader />
        <div className="hidden lg:block h-16"></div> {/* Spacer for fixed header on desktop only */}
        <MobilePageHeader title="Templates" backHref="/" />
        <main className="flex-1 flex items-center justify-center w-full px-4 pb-16 lg:pb-0 pt-16 lg:pt-0">
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase mb-4">Login Required</h2>
            <p className="text-black/60 mb-4">Please login to access the designs page</p>
          </div>
        </main>
        <Footer />
        <AuthModal
          open={authOpen}
          onOpenChange={setAuthOpen}
          onSuccess={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white w-full overflow-x-hidden">
      <ShopHeader />
      <div className="hidden lg:block h-16"></div> {/* Spacer for fixed header on desktop only */}
      <MobilePageHeader title="Templates" backHref="/" />

      <main className="flex-1 w-full pt-16 lg:pt-0 pb-8 md:pb-12">
        <section className="py-4 md:py-8 lg:py-12 w-full">
          <div className="w-full px-4 md:px-10 lg:px-16">
            {/* HEADER */}
            <div className="space-y-4 mb-6 md:mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-black uppercase">Templates</h2>
                <p className="text-xs md:text-sm uppercase tracking-widest text-black/50 mt-1">
                  Curated Collection
                </p>
              </div>
              
              {/* Quick Navigation - Single Row */}
              <div className="flex flex-wrap gap-2 w-full">
                <Button asChild variant="outline" size="sm" className="border-black font-bold uppercase text-xs flex-1 min-w-[100px] md:flex-initial">
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                    Dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="border-black font-bold uppercase text-xs flex-1 min-w-[100px] md:flex-initial">
                  <Link href="/dashboard/orders">
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    Orders
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="border-black font-bold uppercase text-xs flex-1 min-w-[100px] md:flex-initial">
                  <Link href="/admin/products">
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                    Admin
                  </Link>
                </Button>
                <Button
                  asChild
                  className="flex-1 md:flex-initial md:ml-auto h-9 md:h-11 px-4 md:px-8 bg-black text-white font-black uppercase hover:bg-black/90 text-xs md:text-base whitespace-nowrap"
                >
                  <Link href="/dashboard/upload">
                    <Palette className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Create Custom Design</span>
                    <span className="sm:hidden">Create</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* TABS */}
            <Tabs defaultValue="all" className="space-y-10">
              <TabsList className="flex flex-wrap gap-2 bg-transparent p-0">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="uppercase text-xs font-black tracking-widest border border-black px-5 py-2
                               data-[state=active]:bg-black data-[state=active]:text-white"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category} value={category}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 w-full">
                    {filterByCategory(category).map((design) => {
                      const imageUrl =
                        typeof design.thumbnail_url === "string" &&
                        design.thumbnail_url.trim().length > 0
                          ? design.thumbnail_url.trim()
                          : "/placeholder.svg"

                      return (
                        <div
                          key={design.id}
                          className="group border border-black/15 hover:border-black transition bg-white flex flex-col"
                        >
                          {/* IMAGE */}
                          <div className="aspect-[3/4] overflow-hidden bg-neutral-100">
                            <img
                              src={imageUrl}
                              alt={design.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>

                          {/* CONTENT */}
                          <div className="p-4 flex flex-col flex-1">
                            <h3 className="text-sm font-black uppercase truncate">
                              {design.name}
                            </h3>

                            <p className="text-xs text-black/60 line-clamp-2 mb-3">
                              {design.description}
                            </p>

                            <Link
                              href={`/designs/${design.id}`}
                              className="mt-auto block text-center border border-black py-2 text-xs font-black uppercase
                                         hover:bg-black hover:text-white transition"
                            >
                              Use Design
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Load More */}
                  {hasMore && category === "all" && (
                    <div className="flex justify-center mt-10">
                      <Button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        variant="outline"
                        className="border-black font-black uppercase px-10"
                      >
                        {loadingMore ? "Loading..." : "Load More"}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSuccess={() => window.location.reload()}
      />
    </div>
  )
}
