import { createClient } from "@/lib/supabase/server"
import { ShopHeader } from "@/components/shop-header"
import { HeroCarousel } from "@/components/hero-carousel"
import Link from "next/link"
import Image from "next/image"
import { ProductCard } from "@/components/product-card"
import { Footer } from "@/components/footer"
import { ShopSection } from "@/components/shop-section"
import { MobileSearchBox } from "@/components/mobile-search-box"

/* ---------------- TYPES ---------------- */

type Category = {
  id: number
  name: string
  slug: string
  image: string
  badge?: string
}

type HeroSection = {
  title: string
  subtitle?: string
  link: string
  images: string[]
}

/* ---------------- HERO DATA (ADDED) ---------------- */

const heroSections: HeroSection[] = [
  {
    title: "OFFICE WARDROBE",
    link: "/shop?category=shirt",
    images: [
      "/hero-office-wardrobe.jpg",
      "/category-shirts.jpg",
      "/category-trousers.jpg",
    ],
  },
  {
    title: "T-SHIRTS",
    subtitle: "EASY FIX, QUICK PICKS",
    link: "/shop?category=tshirt",
    images: [
      "/category-shirts.jpg",
      "/category-trousers.jpg",
      "/images/shirt-chambray.jpg",
    ],
  },
  {
    title: "FLANNEL CHECK SHIRTS",
    link: "/shop?category=shirt",
    images: [
      "category-jeans.jpg",
      "/images/formal-trousers.jpg",
    ],
  },
]

/* ---------------- STATIC DATA ---------------- */

const categories: Category[] = [
  { id: 1, name: "MEDITERRANEAN MOSAIC", slug: "shirt", image: "/category-mediterranean.jpg" },
  { id: 2, name: "SHIRTS", slug: "shirt", image: "/category-shirts.jpg" },
  { id: 3, name: "TROUSERS", slug: "trousers", image: "/category-trousers.jpg" },
  { id: 4, name: "JEANS", slug: "jeans", image: "/category-jeans.jpg" },
  { id: 5, name: "POLOS", slug: "polos", image: "/category-polos.jpg" },
  { id: 6, name: "WINTERWEAR", slug: "winterwear", image: "/category-winterwear.jpg" },
  { id: 7, name: "HOLIDAY FITS", slug: "shirt", image: "/category-holiday.jpg" },
  { id: 8, name: "ESSENTIALS", slug: "tshirt", image: "/category-essentials.jpg" },
  { id: 9, name: "FOOTWEAR", slug: "shoes", image: "/category-footwear.jpg", badge: "JUST LAUNCHED" },
  { id: 10, name: "PLUS SIZE", slug: "shirt", image: "/category-plussize.jpg" },
  { id: 11, name: "PRICE DROP", slug: "sale", image: "/category-pricedrop.jpg" },
]

/* ---------------- PAGE ---------------- */

export default async function HomePage() {
  const supabase = await createClient()

  const { data: newProducts } = await supabase
    .from("catalog_products")
    .select("*")
    .eq("is_featured", true)
    .limit(10)

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <ShopHeader />
      <div className="hidden lg:block h-16"></div> {/* Spacer for top header on desktop only */}

      <main className="w-full">
        {/* Mobile Search Box (Fixed at top on mobile only) */}
        <div className="lg:hidden fixed top-0 left-0 right-0 w-full px-4 py-3 bg-white border-b border-black/10 z-50">
          <MobileSearchBox />
        </div>
        
        {/* Spacer for fixed search box on mobile */}
        <div className="lg:hidden h-16"></div>

        {/* ---------------- HERO (UPDATED ONLY HERE) ---------------- */}
        <section className="w-full">
          <div className="grid md:grid-cols-3 gap-0 w-full">
            {heroSections.map((section) => (
              <HeroCarousel key={section.title} section={section} />
            ))}
          </div>
        </section>

        {/* ---------------- FEATURED CATEGORIES ---------------- */}
        <section className="py-12 bg-white w-full">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <h2 className="text-center text-3xl font-black uppercase mb-8">
              FEATURED CATEGORIES
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-0 w-full">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`/shop?category=${category.slug}`}
                  className="group relative aspect-[3/4] overflow-hidden w-full"
                >
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
                  <div className="absolute bottom-0 p-6 text-white">
                    <h3 className="text-2xl font-black uppercase">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 w-full">
              {categories.slice(6).map((category) => (
                <Link
                  key={category.id}
                  href={`/shop?category=${category.slug}`}
                  className="group relative aspect-[3/4] overflow-hidden w-full"
                >
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
                  <div className="absolute bottom-0 p-6 text-white">
                    <h3 className="text-xl font-black uppercase">
                      {category.name}
                    </h3>
                    {category.badge && (
                      <span className="inline-block mt-2 px-4 py-1 bg-white/20 rounded-full text-xs font-bold">
                        {category.badge}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- SALE BANNER ---------------- */}
        <section className="w-full py-6 bg-white">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <Link href="/shop?category=sale">
              <div className="relative w-full aspect-[1877/504] cursor-pointer rounded-lg overflow-hidden">
                <Image
                  src="/images/image.png"
                  alt="Last chance! Up to 40% OFF"
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-[1.01]"
                  priority
                />
              </div>
            </Link>
          </div>
        </section>

        {/* ---------------- CUSTOMIZE CTA (PROMINENT) ---------------- */}
        <section className="py-6 bg-white w-full">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <div className="border border-black/40 rounded-xl px-6 md:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl md:text-2xl font-black uppercase">
                  Customize Your Style
                </h3>
                <p className="text-sm md:text-base text-black/60">
                  Design it your way — fit, fabric & finish.
                </p>
              </div>

              <Link href="/designs">
                <button className="px-6 md:px-8 py-3 border-2 border-black text-black font-black uppercase text-sm md:text-base hover:bg-black hover:text-white transition">
                  Start Designing
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* ---------------- PRODUCTS ---------------- */}
        <section className="py-12 bg-gray-50 w-full">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <h2 className="text-center text-3xl font-black uppercase mb-8">
              NEW AND POPULAR
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 w-full">
              {newProducts?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- SHOP SECTION ---------------- */}
        <ShopSection />
      </main>

      <Footer />
    </div>
  )
}
