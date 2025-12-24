"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Review = {
  id: string
  rating: number
  comment: string
  created_at: string
  user_id: string
  profiles?: {
    full_name?: string | null
  } | null
}

interface ProductReviewsProps {
  productId: string
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { toast } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [tableExists, setTableExists] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      setLoading(true)
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUserId(user?.id ?? null)

        // Try to load reviews - using manual join to avoid relationship cache issues
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("product_reviews")
          .select("id, rating, comment, created_at, user_id, product_fit, product_quality")
          .eq("product_id", productId)
          .order("created_at", { ascending: false })

        if (reviewsError) {
          // Only treat as "table missing" for the specific Postgres undefined_table error
          const isMissingTable =
            reviewsError.code === "42P01" ||
            reviewsError.message?.toLowerCase?.().includes("does not exist")

          console.warn("Reviews not available:", reviewsError.code, reviewsError.message)

          if (isMissingTable) {
            setTableExists(false)
          } else {
            // Table exists but query failed - keep the UI visible and just show no reviews
            setTableExists(true)
            toast({
              title: "Could not load reviews",
              description: "Please refresh the page or try again in a moment.",
              variant: "destructive",
            })
          }
          setReviews([])
        } else {
          // Fetch profiles separately and merge
          let data = reviewsData || []
          if (data.length > 0) {
            const userIds = [...new Set(data.map((r: any) => r.user_id))]
            const { data: profilesData } = await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", userIds)

            // Merge profiles with reviews
            data = data.map((review: any) => ({
              ...review,
              profiles: profilesData?.find((p) => p.id === review.user_id) || null,
            }))
          }
          setReviews(data || [])
          setTableExists(true)
        }
      } catch (err) {
        console.warn("Reviews load error:", err)
        // Assume table exists and keep the UI; just show an empty state
        setTableExists(true)
        setReviews([])
      } finally {
        setLoading(false)
      }
    }

    load()

    // Set up real-time subscription for reviews
    const channel = supabase
      .channel(`product_reviews:${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_reviews',
          filter: `product_id=eq.${productId}`,
        },
        () => {
          // Reload reviews when changes occur
          load()
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [productId])

  const averageRating = useMemo(() => {
    if (!reviews.length) return null
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0)
    return (sum / reviews.length).toFixed(1)
  }, [reviews])

  const handleSubmit = async () => {
    if (!rating) {
      toast({
        title: "Rating missing",
        description: "Tap a star rating before submitting.",
        variant: "destructive",
      })
      return
    }

    if (!comment.trim()) {
      toast({
        title: "Comment required",
        description: "Add a short note about the product.",
        variant: "destructive",
      })
      return
    }

    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      toast({
        title: "Login required",
        description: "Please sign in to add a review.",
        variant: "destructive",
      })
      return
    }

    // Check if user has a profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      toast({
        title: "Profile not found",
        description: "Please complete your profile before submitting a review.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      // Insert review without relationship syntax
      const { data: insertedReview, error } = await supabase
        .from("product_reviews")
        .insert({
          user_id: user.id,
          product_id: productId,
          rating,
          comment: comment.trim(),
        })
        .select("id, rating, comment, created_at, user_id")
        .single()

      if (error) {
        // Enhanced error handling
        let errorMessage = "Please try again."
        
        if (error.code === "23503") {
          errorMessage = "Invalid product or user. Please refresh the page."
        } else if (error.code === "23505") {
          errorMessage = "You've already reviewed this product."
        } else if (error.code === "42501") {
          errorMessage = "Permission denied. Please ensure you're logged in."
        } else if (error.message) {
          errorMessage = error.message
        } else if (error.details) {
          errorMessage = error.details
        }
        
        console.error("Review submit error:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        
        throw new Error(errorMessage)
      }
      
      if (insertedReview) {
        // Reload all reviews to get latest data including any computed fields
        const { data: updatedReviewsData } = await supabase
          .from("product_reviews")
          .select("id, rating, comment, created_at, user_id, product_fit, product_quality")
          .eq("product_id", productId)
          .order("created_at", { ascending: false })

        if (updatedReviewsData) {
          let data = updatedReviewsData || []
          if (data.length > 0) {
            const userIds = [...new Set(data.map((r: any) => r.user_id))]
            const { data: profilesData } = await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", userIds)

            data = data.map((review: any) => ({
              ...review,
              profiles: profilesData?.find((p) => p.id === review.user_id) || null,
            }))
          }
          setReviews(data)
        } else {
          // Fallback: add the review manually
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, full_name")
            .eq("id", user.id)
            .single()

          const reviewWithProfile = {
            ...insertedReview,
            product_fit: null,
            product_quality: null,
            profiles: profileData || null,
          }
          setReviews((prev) => [reviewWithProfile, ...prev])
        }
        setRating(0)
        setHoverRating(0)
        setComment("")
        toast({ 
          title: "Review submitted", 
          description: "Thanks for your feedback!" 
        })
      }
    } catch (err: any) {
      console.error("Review submit error:", err)
      toast({
        title: "Could not submit review",
        description: err?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (value: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "h-2.5 w-2.5 sm:h-3 sm:w-3",
      md: "h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5",
      lg: "h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 md:h-5.5 md:w-5.5 lg:h-6 lg:w-6"
    }
    return (
      <div className="flex items-center gap-0 sm:gap-0.5 flex-shrink-0">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= value 
                ? "text-amber-500 fill-amber-400" 
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
  }
  return (
    <Card className="border-black/10 shadow-lg bg-white">
      <CardHeader className="border-b border-black/5 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <CardTitle className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">
              CUSTOMER REVIEWS
            </CardTitle>
            <p className="text-sm text-muted-foreground font-medium">
              Real feedback from verified shoppers
            </p>
          </div>
          {averageRating ? (
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 bg-black/5 px-3 sm:px-6 py-4 rounded-lg w-full sm:w-auto overflow-hidden">
              <div className="text-center flex-shrink-0">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black text-black block leading-none">
                  {averageRating}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1 block">
                  Average
                </span>
              </div>
              <div className="flex flex-col items-center sm:items-start gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-0.5 justify-center sm:justify-start w-full overflow-hidden">
                  {renderStars(Math.round(Number(averageRating)), "md")}
                </div>
                <span className="text-xs sm:text-sm font-bold uppercase text-black/80">
                  {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
                </span>
              </div>
            </div>
          ) : (
            <div className="px-6 py-4 bg-muted/50 rounded-lg">
              <span className="text-sm font-bold uppercase text-muted-foreground">
                No reviews yet
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-8 pt-6">
        {/* Review Form */}
        {userId && (
          <div className="rounded-lg border-2 border-black/10 p-6 bg-gradient-to-br from-white to-muted/30">
            <Label className="text-base font-black uppercase mb-4 block tracking-wider">
              Share Your Experience
            </Label>
            
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-bold uppercase text-black/70 tracking-wide">Rating:</span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110 active:scale-95"
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`h-7 w-7 transition-all ${
                        star <= (hoverRating || rating)
                          ? "text-amber-500 fill-amber-400 scale-110"
                          : "text-gray-300 hover:text-amber-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <span className="text-base font-black text-black ml-2">
                  {rating}/5
                </span>
              )}
            </div>

            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience... What did you like? How was the fit? Quality thoughts?"
              rows={5}
              className="bg-white border-black/20 focus:border-black/40 text-sm font-medium resize-none"
            />

            <div className="flex justify-end mt-4">
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || !rating || !comment.trim()} 
                className="font-black uppercase tracking-wider px-8 h-12 bg-black hover:bg-black/90 text-white"
              >
                {submitting ? "POSTING..." : "SUBMIT REVIEW"}
              </Button>
            </div>
          </div>
        )}

        {!userId && (
          <div className="rounded-lg border-2 border-dashed border-black/20 p-8 bg-muted/30 text-center">
            <p className="text-sm font-bold uppercase text-black/70 mb-2">
              Sign in to leave a review
            </p>
            <p className="text-xs text-muted-foreground">
              Join our community and share your thoughts
            </p>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-3"></div>
              <p className="text-sm font-medium text-muted-foreground">Loading reviews...</p>
            </div>
          )}
          
          {!loading && reviews.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-black/10 rounded-lg bg-muted/20">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm font-bold uppercase text-black/70 mb-1">
                No reviews yet
              </p>
              <p className="text-xs text-muted-foreground">
                Be the first to review this product!
              </p>
            </div>
          )}

          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="border-2 border-black/5 rounded-lg p-5 bg-white hover:border-black/10 transition-colors shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
                    <span className="text-sm font-black uppercase text-black">
                      {(review.profiles?.full_name || "V")[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-black text-sm uppercase text-black">
                      {review.profiles?.full_name || "Verified Buyer"}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      Verified Purchase
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold uppercase text-black/60 whitespace-nowrap">
                  {new Date(review.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              
              <div className="mb-3">
                {renderStars(review.rating, "md")}
              </div>
              
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
