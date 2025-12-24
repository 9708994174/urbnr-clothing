"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Slider } from "@/components/ui/slider"

interface ShopFiltersProps {
  onFilterChange?: (filters: any) => void
  onApply?: (filters: any) => void
  priceRange?: { min: number; max: number }
  isMobile?: boolean
}

export function ShopFilters({ onFilterChange, onApply, priceRange, isMobile = false }: ShopFiltersProps) {
  const defaultMaxPrice = priceRange?.max || 5000
  const defaultMinPrice = priceRange?.min || 0
  
  const [filters, setFilters] = useState({
    deliveryTime: [] as string[],
    category: [] as string[],
    size: [] as string[],
    color: [] as string[],
    pattern: [] as string[],
    fit: [] as string[],
    material: [] as string[],
    collar: [] as string[],
    sleeves: [] as string[],
    price: { min: defaultMinPrice, max: defaultMaxPrice },
  })

  useEffect(() => {
    if (priceRange) {
      setFilters((prev) => ({
        ...prev,
        price: { min: priceRange.min, max: priceRange.max },
      }))
    }
  }, [priceRange])

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    deliveryTime: false,
    category: false,
    size: false,
    color: false,
    pattern: false,
    fit: false,
    material: false,
    collar: false,
    sleeves: false,
    price: false,
  })

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const filterOptions = {
    deliveryTime: ["1-2 Days", "3-5 Days", "5-7 Days", "7+ Days"],
    category: ["Shirts", "T-Shirts", "Jeans", "Jackets", "Sweaters"],
    size: ["XS", "S", "M", "L", "XL", "XXL"],
    color: ["Black", "White", "Blue", "Red", "Green", "Brown", "Grey", "Beige"],
    pattern: ["Solid", "Striped", "Checked", "Printed", "Plain"],
    fit: ["Slim Fit", "Regular Fit", "Relaxed Fit", "Oversized"],
    material: ["Cotton", "Polyester", "Linen", "Denim", "Wool"],
    collar: ["Regular Collar", "Button Down", "Mandarin", "Band"],
    sleeves: ["Full Sleeves", "Half Sleeves", "Sleeveless"],
  }

  const toggleFilter = (section: string, value: string) => {
    setFilters((prev) => {
      const current = prev[section as keyof typeof prev] as string[]
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      
      return { ...prev, [section]: updated }
    })
  }

  const clearFilters = () => {
    const cleared = {
      deliveryTime: [],
      category: [],
      size: [],
      color: [],
      pattern: [],
      fit: [],
      material: [],
      collar: [],
      sleeves: [],
      price: { min: defaultMinPrice, max: defaultMaxPrice },
    }
    setFilters(cleared)
    // Don't call onFilterChange here - only on Apply button
  }

  const getActiveCount = () => {
    let count = 0
    Object.values(filters).forEach((filter) => {
      if (Array.isArray(filter)) {
        count += filter.length
      } else if (filter && typeof filter === 'object' && 'min' in filter && 'max' in filter) {
        // Check if price filter is not at default values
        if (filter.min !== defaultMinPrice || filter.max !== defaultMaxPrice) {
          count += 1
        }
      }
    })
    return count
  }

  const handlePriceChange = (values: number[]) => {
    const newPrice = { min: values[0], max: values[1] }
    setFilters((prev) => ({ ...prev, price: newPrice }))
    // Don't call onFilterChange here - only on Apply button
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const containerClasses = isMobile
    ? "w-full bg-white p-6 overflow-y-auto"
    : "w-64 bg-white border-r border-black/10 p-6 h-full overflow-y-auto sticky top-16 max-h-[calc(100vh-64px)] hidden lg:block"

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black uppercase">FILTERS</h2>
        {getActiveCount() > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs font-bold uppercase underline cursor-pointer hover:text-black/70 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {Object.entries(filterOptions).map(([key, options]) => (
        <Collapsible
          key={key}
          open={openSections[key]}
          onOpenChange={() => toggleSection(key)}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border-b border-black/10 cursor-pointer hover:bg-black/5 transition-colors">
            <span className="text-sm font-bold uppercase">{key.replace(/([A-Z])/g, " $1").trim()}</span>
            {openSections[key] ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="py-3 space-y-2">
            {options.map((option) => {
              const filterValue = filters[key as keyof typeof filters]
              const isSelected = Array.isArray(filterValue) && filterValue.includes(option)
              return (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer text-sm hover:text-black"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleFilter(key, option)}
                    className="w-4 h-4 border-black rounded"
                  />
                  <span>{option}</span>
                </label>
              )
            })}
          </CollapsibleContent>
        </Collapsible>
      ))}

      {/* PRICE FILTER */}
      <Collapsible
        open={openSections.price}
        onOpenChange={() => toggleSection("price")}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border-b border-black/10 cursor-pointer hover:bg-black/5 transition-colors">
          <span className="text-sm font-bold uppercase">PRICE</span>
          {openSections.price ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="py-3 space-y-4">
          <div className="space-y-3">
            <Slider
              value={[filters.price.min, filters.price.max]}
              onValueChange={handlePriceChange}
              min={defaultMinPrice}
              max={defaultMaxPrice}
              step={10}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold">{formatPrice(filters.price.min)}</span>
              <span className="text-black/60">to</span>
              <span className="font-bold">{formatPrice(filters.price.max)}</span>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.price.min}
              onChange={(e) => {
                const min = Math.max(defaultMinPrice, Math.min(defaultMaxPrice, Number(e.target.value) || defaultMinPrice))
                handlePriceChange([min, filters.price.max])
              }}
              className="w-full border border-black/20 px-2 py-1.5 text-sm rounded cursor-text"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.price.max}
              onChange={(e) => {
                const max = Math.max(defaultMinPrice, Math.min(defaultMaxPrice, Number(e.target.value) || defaultMaxPrice))
                handlePriceChange([filters.price.min, max])
              }}
              className="w-full border border-black/20 px-2 py-1.5 text-sm rounded cursor-text"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="mt-6 pt-6 border-t border-black/10">
        <Button
          className="w-full bg-black text-white font-black uppercase hover:bg-black/90"
          onClick={() => {
            onFilterChange?.(filters)
            onApply?.(filters)
          }}
        >
          APPLY ({getActiveCount()})
        </Button>
      </div>
    </div>
  )
}

