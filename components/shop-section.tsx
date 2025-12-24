"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

const PRODUCTS_PER_PAGE = 10

export function ShopSection() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  useEffect(() => {
    loadProducts(0)
  }, [])

  const loadProducts = async (pageNum: number) => {
    try {
      const supabase = createClient()
      const from = pageNum * PRODUCTS_PER_PAGE
      const to = from + PRODUCTS_PER_PAGE - 1

      const { data, error } = await supabase
        .from("catalog_products")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) throw error

      if (pageNum === 0) {
        setProducts(data || [])
      } else {
        setProducts((prev) => [...prev, ...(data || [])])
      }

      setHasMore((data?.length || 0) === PRODUCTS_PER_PAGE)
      setPage(pageNum)
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = async () => {
    setLoadingMore(true)
    await loadProducts(page + 1)
  }

  if (loading) {
    return (
      <section className="py-12 bg-white w-full">
        <div className="w-full px-4 md:px-10 lg:px-16">
          <h2 className="text-center text-3xl font-black uppercase mb-8">
            BROWSE ALL
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-0 w-full">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-200 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 bg-white w-full">
      <div className="w-full px-4 md:px-10 lg:px-16">
        <h2 className="text-center text-3xl font-black uppercase mb-8">
          BROWSE ALL
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 w-full mb-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center">
            <Button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3 bg-black text-white font-black uppercase hover:bg-black/90"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More "
              )}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
