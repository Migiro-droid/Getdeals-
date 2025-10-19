import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Zap } from "lucide-react";

const WhoWeServe = () => {
  const customerGroups = [
    {
      title: 'Transport & Mobility',
      subtitle: 'Bolt / Uber / Little / Boda Boda Riders / Matatu Drivers / Conductors',
      tagline: 'Fuel your hustle. Save every ride.',
      connector: 'Just because you rode here.',
      cta: 'Your hustle moves Kenya — your savings move you.',
      image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=600&fit=crop',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      title: 'Teachers & Education Workers',
      subtitle: 'Teachers / Lecturers / Tutors / School Staff',
      tagline: 'Teach more, spend less.',
      connector: 'Just because you work or study here.',
      cta: 'Knowledge pays — but GET DEALS saves.',
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop',
      color: 'from-green-600 to-emerald-600'
    },
    {
      title: 'Police & Security Forces',
      subtitle: 'Police / Watchmen / Guards',
      tagline: "Protecting others shouldn't cost you everything.",
      connector: 'Just because you serve here.',
      cta: 'Your service matters — your savings should too.',
      image: 'https://images.unsplash.com/photo-1590642916589-592bca10dfbf?w=800&h=600&fit=crop',
      color: 'from-indigo-600 to-blue-600'
    },
    {
      title: 'Civil Servants & Public Officers',
      subtitle: 'Government & County Staff / Clerks / Officers',
      tagline: 'Serve the nation, save your wallet.',
      connector: "Just because you're on payroll here.",
      cta: 'We reward your service with savings.',
      image: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=800&h=600&fit=crop',
      color: 'from-purple-600 to-pink-600'
    },
    {
      title: 'Corporate Employees',
      subtitle: 'Bank Tellers / Admin Staff / Managers / Executives',
      tagline: 'For those who clock in and cash out wisely.',
      connector: 'Just because you work here.',
      cta: 'From desk to dinner — smart people save smart.',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
      color: 'from-gray-700 to-gray-900'
    },
    {
      title: 'Healthcare Workers',
      subtitle: 'Doctors / Nurses / Clinicians / Hospital Staff',
      tagline: 'Caregivers deserve care too.',
      connector: 'Just because we treated you here.',
      cta: 'You heal lives — we help you save yours.',
      image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&h=600&fit=crop',
      color: 'from-red-600 to-rose-600'
    },
    {
      title: 'Salon & Grooming Pros',
      subtitle: 'Barbers / Salonists / Spa Technicians / Beauty Therapists',
      tagline: 'Clean cuts. Cleaner savings.',
      connector: "Just because you spa'd here.",
      cta: 'Look good. Feel good. Save better.',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop',
      color: 'from-pink-600 to-rose-600'
    },
    {
      title: 'Retail & Hustlers',
      subtitle: 'Mama Mbogas / Hawkers / Market Sellers / Small Shop Owners',
      tagline: 'For those who keep Kenya fed and moving.',
      connector: 'Just because you shopped or sold here.',
      cta: 'Buy wholesale value in retail packs.',
      image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&h=600&fit=crop',
      color: 'from-orange-600 to-amber-600'
    },
    {
      title: 'Hospitality Workers',
      subtitle: 'Hotel Staff / Waiters / Chefs / Housekeepers / Caterers',
      tagline: 'Service heroes deserve sweeter bills.',
      connector: 'Just because you served here.',
      cta: 'Your hard work should taste like a discount.',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
      color: 'from-yellow-600 to-orange-600'
    },
    {
      title: 'Students & Youth',
      subtitle: 'Students / Interns / Apprentices',
      tagline: 'Study. Hustle. Save.',
      connector: 'Just because you learned or interned here.',
      cta: 'Build your future — one saved shilling at a time.',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop',
      color: 'from-teal-600 to-green-600'
    },
    {
      title: 'Families & Parents',
      subtitle: 'Mothers / Single Parents / Households',
      tagline: 'Because family budgets deserve breathing room.',
      connector: 'Just because you buy for your home.',
      cta: 'Save more. Feed better. Live lighter.',
      image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=600&fit=crop',
      color: 'from-rose-600 to-pink-600'
    },
    {
      title: 'Casual & Gig Workers',
      subtitle: 'Construction Hands / Freelancers / Riders / App Workers',
      tagline: 'Irregular income, consistent savings.',
      connector: 'Just because you worked here.',
      cta: 'Even one gig deserves great deals.',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop',
      color: 'from-lime-600 to-green-600'
    },
    {
      title: 'Pensioners & Retirees',
      subtitle: 'Senior Citizens / Retired Professionals',
      tagline: 'Age with dignity. Spend wisely.',
      connector: 'Just because you saved here.',
      cta: 'Your years earned this comfort — save every day.',
      image: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800&h=600&fit=crop',
      color: 'from-amber-600 to-yellow-600'
    },
    {
      title: 'Faith & Community',
      subtitle: 'Church Goers / Mosques / Unions / CBOs / NGOs',
      tagline: 'Together we save more.',
      connector: 'Just because you pray or serve here.',
      cta: 'Blessings multiply — so should your discounts.',
      image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&h=600&fit=crop',
      color: 'from-violet-600 to-purple-600'
    },
    {
      title: 'Travelers & Explorers',
      subtitle: 'Commuters / Holiday Makers / Backpackers',
      tagline: 'Travel light. Save heavy.',
      connector: 'Just because you flew or boarded here.',
      cta: 'Your journey begins with a deal.',
      image: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&h=600&fit=crop',
      color: 'from-sky-600 to-blue-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* BRAND MOTTO BANNER */}
      <div className="relative bg-black overflow-hidden border-b-2 border-red-600">
        {/* Dynamic Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-red-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 py-3 relative z-10">
          <div className="flex flex-col items-center text-center space-y-2">
            {/* Main Motto */}
            <div className="relative">
              {/* Main Text */}
              <h1 className="relative text-2xl md:text-3xl lg:text-4xl font-black leading-tight">
                <span className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent drop-shadow-lg">
                  "For everyone who works hard — and deserves more"
                </span>
              </h1>
            </div>

            {/* Supporting Text */}
            <p className="text-white text-sm md:text-base font-semibold max-w-3xl">
              No fees. No obligations. Just discounts, deals, and savings — money back into your pocket.
            </p>

            {/* Accent Line with Icons */}
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-red-600 fill-red-600" />
                <span className="text-gray-400 font-semibold text-xs uppercase tracking-wider">
                  Your Shopping Partner
                </span>
                <ShoppingBag className="h-3 w-3 text-rose-600" />
              </div>
              <div className="h-px w-8 bg-gradient-to-r from-transparent via-rose-600 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Groups Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          {/* Left-side Board Pin - Removed */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
              Find Your Community
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              No matter who you are or what you do, GET DEALS was built for you.
            </p>
          </div>

          {/* Simple Grid - No Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {customerGroups.map((group, index) => (
              <div 
                key={index}
                className="group border-l-4 border-gray-200 pl-6 hover:border-blue-600 transition-colors duration-300"
              >
                {/* Content - Clean & Minimal */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {group.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                  {group.subtitle}
                </p>
                <p className="text-base font-semibold text-gray-800 mb-3 italic">
                  "{group.tagline}"
                </p>
                <p className="text-sm text-blue-600 font-medium mb-4">
                  {group.connector}
                </p>

                {/* Button */}
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg px-4 py-2 text-sm"
                  asChild
                >
                  <Link to="/products">
                    Shop Now <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          {/* Simple Bottom CTA */}
          <div className="mt-24 text-center max-w-3xl mx-auto">
            <h3 className="text-4xl font-black text-gray-900 mb-4">
              Don't See Your Group?
            </h3>
            <p className="text-lg text-gray-600 mb-8">
              GET DEALS is for <span className="font-black text-blue-600">everyone</span> who works hard. 
              Start saving today — no questions asked.
            </p>
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-6 rounded-lg"
              asChild
            >
              <Link to="/products">
                Start Shopping Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WhoWeServe;
