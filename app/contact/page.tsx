import { ShopHeader } from "@/components/shop-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin, Clock } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <ShopHeader />
      <div className="hidden lg:block h-16"></div> {/* Spacer for fixed header on desktop only */}

      <main className="w-full pb-8 md:pb-12">
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 bg-black text-white">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <h1 className="text-5xl md:text-7xl font-black uppercase mb-6">CONTACT US</h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl">
              Get in touch with our team. We're here to help.
            </p>
          </div>
        </section>

        {/* Contact Info & Form */}
        <section className="w-full py-16 md:py-24 bg-white">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <div className="grid md:grid-cols-2 gap-12 max-w-7xl mx-auto">
              {/* Contact Information */}
              <div>
                <h2 className="text-3xl md:text-4xl font-black uppercase mb-8">GET IN TOUCH</h2>
                
                <div className="space-y-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase mb-1">EMAIL</h3>
                      <p className="text-black/70">support@urbnr.com</p>
                      <p className="text-black/70">info@urbrn.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase mb-1">PHONE</h3>
                      <p className="text-black/70">+919708994174</p>
                      <p className="text-black/70">Mon-Fri: 9AM - 6PM EST</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase mb-1">ADDRESS</h3>
                      <p className="text-black/70">
                        17A NanakNagar, Phagwara<br />
                        Punjab, PGW 144411<br />
                        INDIA
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase mb-1">BUSINESS HOURS</h3>
                      <p className="text-black/70">Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p className="text-black/70">Saturday: 10:00 AM - 4:00 PM</p>
                      <p className="text-black/70">Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <h2 className="text-3xl md:text-4xl font-black uppercase mb-8">SEND US A MESSAGE</h2>
                <form className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-black uppercase mb-2">
                      NAME
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="w-full border border-black/20 px-4 py-3 focus:outline-none focus:border-black"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-black uppercase mb-2">
                      EMAIL
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="w-full border border-black/20 px-4 py-3 focus:outline-none focus:border-black"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-black uppercase mb-2">
                      SUBJECT
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      className="w-full border border-black/20 px-4 py-3 focus:outline-none focus:border-black"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-black uppercase mb-2">
                      MESSAGE
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      className="w-full border border-black/20 px-4 py-3 focus:outline-none focus:border-black resize-none"
                      required
                    ></textarea>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-black text-white font-black uppercase hover:bg-black/90 h-12"
                  >
                    SEND MESSAGE
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
