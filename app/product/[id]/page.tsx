import { createClient } from "@/lib/supabase/server"
import { ShopHeader } from "@/components/shop-header"
import { ProductDetails } from "@/components/product-details"
import { Footer } from "@/components/footer"
import { MobilePageHeader } from "@/components/mobile-page-header"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: product } = await supabase.from("catalog_products").select("name, category").eq("id", id).single()

  if (!product) {
    return {
      title: "Product Not Found | URBNR",
    }
  }

  return {
    title: `${product.name} | ${product.category.toUpperCase()} | URBNR`,
    description: `Shop ${product.name} at URBNR. Premium quality ${product.category} with fast shipping.`,
  }
}
export default async function ProductPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase.from("catalog_products").select("*").eq("id", id).single()

  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <ShopHeader />
      <div className="hidden lg:block h-16"></div> {/* Spacer for fixed header on desktop only */}
      <MobilePageHeader title={product.name} backHref="/shop" />
      <div className="pt-16 lg:pt-0 pb-8 md:pb-12">
        <ProductDetails product={product} />
      </div>
      <Footer />
    </div>
  )
}
