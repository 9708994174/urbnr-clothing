import { ShopHeader } from "@/components/shop-header"
import { Footer } from "@/components/footer"
import Image from "next/image"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <ShopHeader />
      <div className="hidden lg:block h-16"></div> {/* Spacer for fixed header on desktop only */}

      <main className="w-full pb-8 md:pb-12">
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 bg-black text-white">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <h1 className="text-5xl md:text-7xl font-black uppercase mb-6">ABOUT URBNR</h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl">
              Crafting premium menswear with attention to detail and timeless style
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="w-full py-16 md:py-24 bg-white">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
              <div>
                <h2 className="text-4xl md:text-5xl font-black uppercase mb-6">OUR STORY</h2>
                <p className="text-lg text-black/70 mb-4 leading-relaxed">
                  URBNR was born from a passion for quality craftsmanship and contemporary design. 
                  We believe that every man deserves clothing that not only looks exceptional but 
                  feels exceptional too.
                </p>
                <p className="text-lg text-black/70 mb-4 leading-relaxed">
                  Founded with the vision of creating a brand that bridges the gap between 
                  traditional tailoring and modern aesthetics, we've built a reputation for 
                  premium fabrics, meticulous attention to detail, and timeless style.
                </p>
                <p className="text-lg text-black/70 leading-relaxed">
                  Today, URBNR stands as a testament to quality, offering a curated collection 
                  of menswear that celebrates individuality while maintaining the highest 
                  standards of excellence.
                </p>
              </div>
              <div className="relative aspect-[4/3] bg-gray-100">
                <Image
                  src="/category-shirts.jpg"
                  alt="Our Story"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="w-full py-16 md:py-24 bg-gray-50">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-center mb-16">OUR VALUES</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              <div className="text-center">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">✨</span>
                </div>
                <h3 className="text-2xl font-black uppercase mb-4">QUALITY</h3>
                <p className="text-black/70">
                  We source only the finest materials and employ skilled craftspeople 
                  to ensure every piece meets our exacting standards.
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🎨</span>
                </div>
                <h3 className="text-2xl font-black uppercase mb-4">DESIGN</h3>
                <p className="text-black/70">
                  Our designs blend classic elegance with contemporary flair, creating 
                  pieces that transcend trends and stand the test of time.
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🤝</span>
                </div>
                <h3 className="text-2xl font-black uppercase mb-4">INTEGRITY</h3>
                <p className="text-black/70">
                  We conduct business with transparency, honesty, and a commitment to 
                  building lasting relationships with our customers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="w-full py-16 md:py-24 bg-white">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-black uppercase mb-8">OUR MISSION</h2>
              <p className="text-xl text-black/70 leading-relaxed mb-6">
                To empower men to express their unique style through thoughtfully designed, 
                impeccably crafted clothing that combines luxury with accessibility.
              </p>
              <p className="text-lg text-black/60 leading-relaxed">
                We're committed to creating a sustainable future for fashion, one quality 
                garment at a time.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
