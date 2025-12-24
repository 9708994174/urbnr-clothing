import { createClient } from "@/lib/supabase/server"
import { ShopHeader } from "@/components/shop-header"
import { ShopPageClient } from "@/components/shop-page-client"
import { Footer } from "@/components/footer"
import { MobilePageHeader } from "@/components/mobile-page-header"

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ShopPage({ searchParams }: PageProps) {
  const params = await searchParams
  const category = params.category as string | undefined
  const search = params.search as string | undefined
  const supabase = await createClient()

  const categories = [
    { name: "ALL", value: "all" },
    { name: "ACCESSORIES", value: "accessories" },
    { name: "TRENDING", value: "trending" },
    { name: "SALE", value: "sale" },
    { name: "PLUS SIZE", value: "plussize" },
    { name: "BESTSELLERS", value: "bestsellers" },
    { name: "NEW", value: "new" },
    { name: "SHIRTS", value: "shirt" },
    { name: "JACKETS", value: "jacket" },
    { name: "JEANS", value: "jeans" },
    { name: "SWEATERS", value: "sweater" },
    { name: "T-SHIRTS", value: "tshirt" },
  ]

  // Map category values to database categories
  const categoryMap: Record<string, string> = {
    bestsellers: "shirt", // Map to existing category
    new: "tshirt",
    shirt: "shirt",
    jacket: "winterwear",
    jeans: "jeans",
    sweater: "winterwear",
    tshirt: "tshirt",
    accessories: "shoes",
    trending: "shirt",
    sale: "shirt",
    plussize: "shirt",
  }

  // Build query
  let query = supabase.from("catalog_products").select("*")

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`)
  }

  // Apply category filter
  if (category && category !== "all" && categoryMap[category]) {
    query = query.eq("category", categoryMap[category])
  }

  const { data: products } = await query.order("is_featured", { ascending: false }).order("created_at", {
    ascending: false,
  })

  const pageTitle = search
    ? `Search: "${search}"`
    : category && category !== "all"
      ? categories.find((c) => c.value === category)?.name || "Shop"
      : "Shop"

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <ShopHeader />
      <div className="hidden lg:block h-16"></div> {/* Spacer for fixed header on desktop only */}
      <MobilePageHeader title={pageTitle} backHref="/" />

      <main className="w-full pt-16 lg:pt-0 pb-8 md:pb-12">
        {/* Page Header */}
        <section className="bg-secondary border-b border-border py-8 md:py-12 w-full">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <h1 className="text-4xl md:text-5xl font-black uppercase text-center mb-3">
              {search
                ? `Search Results for "${search}"`
                : category && category !== "all"
                  ? categories.find((c) => c.value === category)?.name || "Shop"
                  : "All Products"}
            </h1>
            <div className="h-1 w-24 bg-accent mx-auto" />
          </div>
        </section>

        <ShopPageClient initialProducts={products || []} category={category} search={search} />
      </main>

      <Footer />
    </div>
  )
}
