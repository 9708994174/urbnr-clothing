import Link from "next/link"
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react"
import { UrbnrLogo } from "@/components/urbnr-logo"

export function Footer() {
  return (
    <footer className="bg-black text-white w-full pb-16 lg:pb-0">
      {/* FULL WIDTH WRAPPER */}
      <div className="px-4 md:px-10 lg:px-16 py-14 w-full">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          
          {/* BRAND */}
          <div className="space-y-5">
            <div className="flex items-center space-x-3">
              <UrbnrLogo size={56} className="h-9 w-9" />
              <span className="font-black text-2xl md:text-[1.6rem] tracking-[0.25em]">
                URBNR
              </span>
            </div>
            <p className="text-[15px] md:text-base text-gray-400 max-w-sm leading-relaxed">
              Premium menswear and custom designs. Elevate your wardrobe with our curated collection.
            </p>
          </div>

          {/* SHOP */}
          <div>
            <h3 className="font-bold mb-5 uppercase text-sm md:text-[15px] tracking-wider">
              Shop
            </h3>
            <ul className="space-y-3 text-sm md:text-[15px]">
              <li><Link href="/shop" className="text-gray-400 hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/shop?category=shirt" className="text-gray-400 hover:text-white transition-colors">Shirts</Link></li>
              <li><Link href="/shop?category=tshirt" className="text-gray-400 hover:text-white transition-colors">T-Shirts</Link></li>
              <li><Link href="/shop?category=jeans" className="text-gray-400 hover:text-white transition-colors">Jeans</Link></li>
              <li><Link href="/shop?category=trousers" className="text-gray-400 hover:text-white transition-colors">Trousers</Link></li>
              <li><Link href="/shop?category=winterwear" className="text-gray-400 hover:text-white transition-colors">Winterwear</Link></li>
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <h3 className="font-bold mb-5 uppercase text-sm md:text-[15px] tracking-wider">
              Company
            </h3>
            <ul className="space-y-3 text-sm md:text-[15px]">
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/designs" className="text-gray-400 hover:text-white transition-colors">Custom Designs</Link></li>
              <li><Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/support" className="text-gray-400 hover:text-white transition-colors">My Account</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* ADMIN */}
          <div>
            <h3 className="font-bold mb-5 uppercase text-sm md:text-[15px] tracking-wider">
              Admin
            </h3>
            <ul className="space-y-3 text-sm md:text-[15px]">
              <li><Link href="/admin" className="text-gray-400 hover:text-white transition-colors">Admin Dashboard</Link></li>
              <li><Link href="/admin/products" className="text-gray-400 hover:text-white transition-colors">Admin Products</Link></li>
              <li><Link href="/admin/orders" className="text-gray-400 hover:text-white transition-colors">Admin Orders</Link></li>
            </ul>
          </div>

          {/* SOCIAL */}
          <div>
            <h3 className="font-bold mb-5 uppercase text-sm md:text-[15px] tracking-wider">
              Follow Us
            </h3>
            <div className="flex gap-5">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="h-5.5 w-5.5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="h-5.5 w-5.5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="h-5.5 w-5.5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="YouTube">
                <Youtube className="h-5.5 w-5.5" />
              </a>
            </div>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-[15px] text-gray-400">
          <p>&copy; {new Date().getFullYear()} URBNR. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
