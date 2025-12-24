"use client"

import { useState } from "react"
import { Package } from "lucide-react"
import { validateImageUrl } from "@/lib/utils/image-utils"

interface OrderImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  fallbackClassName?: string
}

export function OrderImage({ src, alt, className = "h-32 w-32 sm:h-40 sm:w-40 object-cover border-2 border-black/20 rounded-lg", fallbackClassName = "h-32 w-32 sm:h-40 sm:w-40 border-2 border-black/20 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0" }: OrderImageProps) {
  const [imgError, setImgError] = useState(false)
  const validatedSrc = validateImageUrl(src)

  if (imgError || !validatedSrc || validatedSrc === "/placeholder.svg") {
    return (
      <div className={fallbackClassName}>
        <Package className="h-16 w-16 text-black/30" />
      </div>
    )
  }

  return (
    <img
      src={validatedSrc}
      alt={alt}
      className={className}
      onError={() => setImgError(true)}
    />
  )
}





