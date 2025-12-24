import { ShopHeader } from "@/components/shop-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Package, Truck, RotateCcw, CreditCard, HelpCircle, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <ShopHeader />
      <div className="hidden lg:block h-16"></div> {/* Spacer for fixed header on desktop only */}

      <main className="w-full pb-8 md:pb-12">
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 bg-black text-white">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <h1 className="text-5xl md:text-7xl font-black uppercase mb-6">SUPPORT CENTER</h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl">
              Find answers to common questions or get help from our team
            </p>
          </div>
        </section>

        {/* Quick Help Cards */}
        <section className="w-full py-16 md:py-24 bg-white">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <h2 className="text-3xl md:text-4xl font-black uppercase text-center mb-12">QUICK HELP</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              <Link href="/support/orders" className="group">
                <div className="border border-black/20 p-8 hover:border-black transition h-full">
                  <Package className="h-12 w-12 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-black uppercase mb-2">ORDER TRACKING</h3>
                  <p className="text-black/70">
                    Track your order status and delivery information
                  </p>
                </div>
              </Link>

              <Link href="/support/returns" className="group">
                <div className="border border-black/20 p-8 hover:border-black transition h-full">
                  <RotateCcw className="h-12 w-12 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-black uppercase mb-2">RETURNS & EXCHANGES</h3>
                  <p className="text-black/70">
                    Learn about our return policy and process
                  </p>
                </div>
              </Link>

              <Link href="/support/shipping" className="group">
                <div className="border border-black/20 p-8 hover:border-black transition h-full">
                  <Truck className="h-12 w-12 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-black uppercase mb-2">SHIPPING INFO</h3>
                  <p className="text-black/70">
                    Shipping options, delivery times, and costs
                  </p>
                </div>
              </Link>

              <Link href="/support/payment" className="group">
                <div className="border border-black/20 p-8 hover:border-black transition h-full">
                  <CreditCard className="h-12 w-12 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-black uppercase mb-2">PAYMENT OPTIONS</h3>
                  <p className="text-black/70">
                    Accepted payment methods and security
                  </p>
                </div>
              </Link>

              <Link href="/support/faq" className="group">
                <div className="border border-black/20 p-8 hover:border-black transition h-full">
                  <HelpCircle className="h-12 w-12 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-black uppercase mb-2">FAQ</h3>
                  <p className="text-black/70">
                    Frequently asked questions and answers
                  </p>
                </div>
              </Link>

              <Link href="/contact" className="group">
                <div className="border border-black/20 p-8 hover:border-black transition h-full">
                  <MessageSquare className="h-12 w-12 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-black uppercase mb-2">CONTACT US</h3>
                  <p className="text-black/70">
                    Get in touch with our support team
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full py-16 md:py-24 bg-gray-50">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <h2 className="text-3xl md:text-4xl font-black uppercase text-center mb-12">FREQUENTLY ASKED QUESTIONS</h2>
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white border border-black/20 p-6">
                <h3 className="text-lg font-black uppercase mb-3">HOW DO I TRACK MY ORDER?</h3>
                <p className="text-black/70">
                  Once your order ships, you'll receive a tracking number via email. 
                  You can use this number to track your package on our website or the 
                  carrier's website.
                </p>
              </div>

              <div className="bg-white border border-black/20 p-6">
                <h3 className="text-lg font-black uppercase mb-3">WHAT IS YOUR RETURN POLICY?</h3>
                <p className="text-black/70">
                  We offer a 30-day return policy on all unworn items in their original 
                  packaging. Items must be in new condition with tags attached. 
                  Customized items are not eligible for returns.
                </p>
              </div>

              <div className="bg-white border border-black/20 p-6">
                <h3 className="text-lg font-black uppercase mb-3">HOW LONG DOES SHIPPING TAKE?</h3>
                <p className="text-black/70">
                  Standard shipping takes 3-5 business days. Express shipping (1-2 business 
                  days) is available at checkout. International shipping times vary by 
                  location.
                </p>
              </div>

              <div className="bg-white border border-black/20 p-6">
                <h3 className="text-lg font-black uppercase mb-3">DO YOU OFFER INTERNATIONAL SHIPPING?</h3>
                <p className="text-black/70">
                  Yes, we ship internationally to most countries. Shipping costs and 
                  delivery times vary by destination. Duties and taxes may apply.
                </p>
              </div>

              <div className="bg-white border border-black/20 p-6">
                <h3 className="text-lg font-black uppercase mb-3">CAN I MODIFY OR CANCEL MY ORDER?</h3>
                <p className="text-black/70">
                  Orders can be modified or cancelled within 2 hours of placement. 
                  After that, please contact our support team. Once an order ships, 
                  it cannot be cancelled but can be returned.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="w-full py-16 md:py-24 bg-black text-white">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-black uppercase mb-6">STILL NEED HELP?</h2>
              <p className="text-xl text-white/80 mb-8">
                Our support team is here to assist you with any questions or concerns
              </p>
              <Link href="/contact">
                <Button className="bg-white text-black font-black uppercase hover:bg-white/90 h-12 px-8">
                  CONTACT SUPPORT
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
