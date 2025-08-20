import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ArrowRight, BarChart3, MessageSquare, Users, Shield, TrendingUp, CheckCircle, Star, Play, Zap, Target, Clock, Award, Globe2, UserPlus, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const Index = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "WhatsApp & SMS Integration",
      description: "Reach employees directly through their phones. Works perfectly across all mobile networks.",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Beautiful dashboards showing team mood trends, response rates, and wellness insights.",
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Organize employees by departments, branches, and custom groups for targeted insights.",
      gradient: "from-purple-500 to-violet-600"
    },
    {
      icon: Shield,
      title: "Anonymous Responses",
      description: "Employees can share honestly without fear. Complete privacy guaranteed.",
      gradient: "from-orange-500 to-red-600"
    },
    {
      icon: TrendingUp,
      title: "Trend Analysis",
      description: "Spot patterns, identify concerns early, and track improvement over time.",
      gradient: "from-teal-500 to-cyan-600"
    },
    {
      icon: Zap,
      title: "Zero Setup for Employees",
      description: "No accounts, no passwords. Just click a link and share how you're feeling.",
      gradient: "from-yellow-500 to-orange-600"
    }
  ];

  const heroSlides = [
    {
      title: "Transform Your Team's Wellness",
      subtitle: "Simple employee mood tracking through WhatsApp",
      description: "Get real insights into team wellness without awkward conversations. Built for Kenyan businesses.",
      cta: "Start Free Trial"
    },
    {
      title: "Built for Kenya's Workforce",
      subtitle: "Local pricing, local support",
      description: "Designed specifically for Kenyan organizations with affordable pricing in KES and local customer support.",
      cta: "View Pricing"
    },
    {
      title: "No Employee Apps Required",
      subtitle: "Works on any phone",
      description: "Your employees just need WhatsApp or SMS. No downloads, no accounts, no hassle.",
      cta: "See How It Works"
    }
  ];

  const testimonials = [
    {
      name: "Grace Wanjiku",
      role: "HR Manager at Nairobi Tech Hub",
      company: "Nairobi Tech Hub",
      content: "StaffPulse helped us identify team burnout before it became a problem. The Kenyan support team is fantastic.",
      rating: 5,
      location: "Nairobi"
    },
    {
      name: "John Kiprotich",
      role: "People Operations at Safari Logistics",
      company: "Safari Logistics",
      content: "Finally, a wellness tool that works for our field teams. The WhatsApp integration is perfect for Kenya.",
      rating: 5,
      location: "Mombasa"
    },
    {
      name: "Mary Njeri",
      role: "HR Director at Equity Bank",
      company: "Equity Bank",
      content: "We've seen a 40% improvement in early problem detection across our branches since implementing StaffPulse.",
      rating: 5,
      location: "Kisumu"
    },
    {
      name: "David Ochieng",
      role: "Team Lead at Safaricom",
      company: "Safaricom",
      content: "The pricing in KES makes it accessible for Kenyan companies. Our employees love how simple it is.",
      rating: 5,
      location: "Eldoret"
    }
  ];

  const pricingPlans = [
    {
      name: "Startup",
      price: "2,500",
      priceUSD: "19",
      currency: "KES",
      description: "Perfect for small teams",
      features: ["1 - 25 employees", "Monthly check-ins", "Basic analytics", "WhatsApp & SMS integration", "Email support"],
      popular: false,
      savings: null
    },
    {
      name: "Business",
      price: "6,500",
      priceUSD: "49",
      currency: "KES",
      description: "For growing organizations",
      features: ["26 - 100 employees", "Weekly check-ins", "Advanced analytics", "Department insights", "Priority support", "Custom branding"],
      popular: true,
      savings: "Most Popular"
    },
    {
      name: "Enterprise",
      price: "15,000",
      priceUSD: "115",
      currency: "KES",
      description: "For large corporations",
      features: ["100+ employees", "Daily check-ins", "Custom analytics", "API access", "Dedicated success manager", "On-site training"],
      popular: false,
      savings: "Best Value"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-page">
      {/* Navigation - Mobile Optimized */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo Section - Mobile Optimized */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm sm:text-lg">SP</span>
              </div>
              <div>
                <span className="text-lg sm:text-2xl font-black text-white">
                  StaffPulse
                </span>
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-white/80 font-medium">Online</span>
                </div>
              </div>
            </div>

            {/* Navigation Links - Mobile Optimized */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-8">
              <a href="#features" className="text-white/80 hover:text-white transition-colors font-medium hover:scale-105 transform duration-200 text-sm">
                Features
              </a>
              <a href="#pricing" className="text-white/80 hover:text-white transition-colors font-medium hover:scale-105 transform duration-200 text-sm">
                Pricing
              </a>
              <a href="#testimonials" className="text-white/80 hover:text-white transition-colors font-medium hover:scale-105 transform duration-200 text-sm">
                Testimonials
              </a>
              <div className="[&>div>button]:bg-white/15 [&>div>button]:text-white [&>div>button]:hover:bg-white/25 [&>div>button]:border-0">
                <ThemeToggle />
              </div>
              <Link to="/auth" className="hidden md:block">
                <Button variant="outline" size="sm" className="bg-white/15 border-white/60 text-white hover:bg-white/25 hover:border-white/80 transition-all duration-300 text-xs">
                  Login
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 group shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-xs px-3">
                  Start Free Trial
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Link to="/auth">
                <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-lg text-xs px-3 py-2">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with RGB Gradient - Mobile Optimized */}
      <section className="relative hero-mobile-height min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 overflow-hidden py-16 sm:py-20 lg:py-0">
        {/* RGB Gradient Background Elements - Mobile Responsive */}
        <div className="absolute top-0 right-0 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-gradient-to-bl from-pink-500/30 via-purple-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-gradient-to-tr from-cyan-500/30 via-blue-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[150px] sm:w-[450px] sm:h-[225px] lg:w-[600px] lg:h-[300px] bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10 min-h-screen flex items-center">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center max-w-7xl mx-auto w-full">
            {/* Left Content */}
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left order-1 lg:order-1">
              {/* Simple Badge */}
              <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <span className="text-xs sm:text-sm font-medium text-white">✨ Welcome to StaffPulse</span>
              </div>

              {/* Clean Main Title - Mobile Optimized */}
              <div className="space-y-4 sm:space-y-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-white">
                  Transform Your Team's
                  <span className="block text-yellow-300">Wellness</span>
                </h1>

                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Simple employee mood tracking through WhatsApp. Get real insights into team wellness without awkward conversations.
                </p>
              </div>

              {/* Action Buttons - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-purple-600 hover:bg-white/90 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    Get Started
                    <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-2" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-xl bg-white/15 border-white/60 text-white hover:bg-white/25 hover:border-white/80 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                  <Play className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center justify-center lg:justify-start space-x-4 sm:space-x-6">
                <div className="flex -space-x-2">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full border-2 border-white flex items-center justify-center">
                    <Users className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                  </div>
                  <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                  </div>
                  <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-2 border-white flex items-center justify-center">
                    <Star className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                  </div>
                  <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full border-2 border-white flex items-center justify-center">
                    <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-white">500+ Companies</p>
                  <p className="text-xs sm:text-sm text-white/70">Trust StaffPulse</p>
                </div>
              </div>
            </div>

            {/* Right Content - Modern Feature Carousel - Mobile Optimized */}
            <div className="relative mt-8 lg:mt-0 order-2 lg:order-2">
              <Carousel
                plugins={[
                  Autoplay({
                    delay: 5000,
                    stopOnInteraction: false,
                  }),
                ]}
                className="w-full max-w-sm sm:max-w-md lg:max-w-xl mx-auto group"
              >
                <CarouselContent>
                  {/* WhatsApp Integration Feature - Mobile Optimized */}
                  <CarouselItem>
                    <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] hover:shadow-[0_35px_60px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 min-h-[320px] sm:min-h-[350px] lg:h-[380px] flex flex-col w-full">

                      {/* Icon */}
                      <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-[0_20px_25px_-5px_rgba(34,197,94,0.4)] hover:shadow-[0_25px_35px_-5px_rgba(34,197,94,0.5)] transition-all duration-300">
                        <MessageSquare className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-white" />
                      </div>

                      {/* Content */}
                      <div className="space-y-3 sm:space-y-4 flex-1 flex flex-col justify-between">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">WhatsApp Native Integration</h3>
                        <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                          Built natively for WhatsApp Business API. Your employees receive mood check-ins directly in their WhatsApp - no external apps, no friction, just seamless communication.
                        </p>

                        {/* Feature Points */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                            <span className="text-white/90 text-xs sm:text-sm">Native WhatsApp experience</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                            <span className="text-white/90 text-xs sm:text-sm">Zero app downloads required</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                            <span className="text-white/90 text-xs sm:text-sm">Instant delivery & responses</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>

                  {/* AI Insights Feature - Mobile Optimized */}
                  <CarouselItem>
                    <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] hover:shadow-[0_35px_60px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 min-h-[320px] sm:min-h-[350px] lg:h-[380px] flex flex-col w-full">

                      {/* Icon */}
                      <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-[0_20px_25px_-5px_rgba(168,85,247,0.4)] hover:shadow-[0_25px_35px_-5px_rgba(168,85,247,0.5)] transition-all duration-300">
                        <BarChart3 className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-white" />
                      </div>

                      {/* Content */}
                      <div className="space-y-3 sm:space-y-4 flex-1 flex flex-col justify-between">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">AI-Powered Intelligence</h3>
                        <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                          Advanced machine learning algorithms analyze mood patterns, predict wellness trends, and automatically generate personalized recommendations for each team member.
                        </p>

                        {/* Feature Points */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                            <span className="text-white/90 text-xs sm:text-sm">Real-time sentiment analysis</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                            <span className="text-white/90 text-xs sm:text-sm">Predictive wellness modeling</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Target className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                            <span className="text-white/90 text-xs sm:text-sm">Automated intervention alerts</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>

                  {/* Productivity Boost Feature - Mobile Optimized */}
                  <CarouselItem>
                    <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] hover:shadow-[0_35px_60px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 min-h-[320px] sm:min-h-[350px] lg:h-[380px] flex flex-col w-full">

                      {/* Icon */}
                      <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-[0_20px_25px_-5px_rgba(59,130,246,0.4)] hover:shadow-[0_25px_35px_-5px_rgba(59,130,246,0.5)] transition-all duration-300">
                        <TrendingUp className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-white" />
                      </div>

                      {/* Content */}
                      <div className="space-y-3 sm:space-y-4 flex-1 flex flex-col justify-between">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Measurable Business Impact</h3>
                        <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                          Transform workplace culture with data-driven wellness initiatives. Companies using StaffPulse report 40% higher employee satisfaction and 25% improved retention rates.
                        </p>

                        {/* Feature Points */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Award className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                            <span className="text-white/90 text-xs sm:text-sm">40% boost in satisfaction</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                            <span className="text-white/90 text-xs sm:text-sm">25% better retention</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                            <span className="text-white/90 text-xs sm:text-sm">Real-time culture insights</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                </CarouselContent>

                {/* Custom Navigation - Hidden by default, visible on hover */}
                <CarouselPrevious className="left-4 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm invisible group-hover:visible transition-all duration-300" />
                <CarouselNext className="right-4 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm invisible group-hover:visible transition-all duration-300" />
              </Carousel>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-glass">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-6 mb-20">
            <Badge variant="outline" className="bg-gradient-glass border-primary/20">
              <Target className="w-4 h-4 mr-2" />
              Powerful Features
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold">Everything You Need for</h2>
            <h3 className="text-4xl lg:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">Team Wellness</h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Powerful features designed to make employee wellness tracking simple, effective, and engaging for modern organizations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group bg-gradient-modern-card border-0 shadow-soft hover:shadow-strong transition-all duration-500 animate-scale-in hover:scale-105" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-medium group-hover:shadow-strong transition-all duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-6 mb-20">
            <Badge variant="outline" className="bg-gradient-glass border-primary/20">
              <Clock className="w-4 h-4 mr-2" />
              Simple Process
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our simple 3-step process designed for modern businesses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "1",
                title: "Add Your Team",
                description: "Upload employee contact info or add them manually. Works with all phone numbers and supports global mobile networks.",
                icon: UserPlus,
                color: "from-blue-500 to-cyan-600"
              },
              {
                step: "2", 
                title: "Send Check-ins",
                description: "Automated WhatsApp/SMS asking 'How are you feeling today?' Perfect for today's mobile-first workforce.",
                icon: MessageSquare,
                color: "from-green-500 to-emerald-600"
              },
              {
                step: "3",
                title: "View Insights",
                description: "Beautiful dashboards showing mood trends, alerts, and actionable team insights in real-time.",
                icon: BarChart3,
                color: "from-purple-500 to-violet-600"
              }
            ].map((item, index) => (
              <div key={index} className="text-center space-y-6 animate-fade-in group" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className={`w-20 h-20 bg-gradient-to-r ${item.color} rounded-3xl flex items-center justify-center mx-auto shadow-strong group-hover:shadow-strong group-hover:scale-110 transition-all duration-300`}>
                  <item.icon className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-3xl font-bold text-primary">Step {item.step}</span>
                  </div>
                  <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gradient-glass">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-6 mb-20">
            <Badge variant="outline" className="bg-gradient-glass border-primary/20">
              <Award className="w-4 h-4 mr-2" />
              Customer Stories
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold">Loved by HR Teams Worldwide</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how organizations around the world are improving team wellness with StaffPulse
            </p>
          </div>

          <Carousel
            plugins={[
              Autoplay({
                delay: 4000,
              }),
            ]}
            className="w-full max-w-6xl mx-auto"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full bg-gradient-modern-card border-0 shadow-soft hover:shadow-strong transition-all duration-300 group">
                    <CardContent className="p-8 space-y-6 h-full flex flex-col">
                      <div className="flex items-center space-x-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                        ))}
                      </div>
                      <p className="text-muted-foreground leading-relaxed text-lg flex-grow">"{testimonial.content}"</p>
                      <div className="space-y-2">
                        <p className="font-bold text-lg group-hover:text-primary transition-colors">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{testimonial.company}</Badge>
                          <span>•</span>
                          <span>{testimonial.location}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 bg-gradient-glass border-primary/20" />
            <CarouselNext className="right-4 bg-gradient-glass border-primary/20" />
          </Carousel>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-6 mb-20">
            <Badge variant="outline" className="bg-gradient-glass border-primary/20">
              <DollarSign className="w-4 h-4 mr-2" />
              Affordable Pricing
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold">Simple Pricing</h2>
            <h3 className="text-4xl lg:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">Made Affordable</h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Transparent pricing with no hidden fees. All plans include free setup and training.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative border-2 group ${plan.popular ? 'border-primary shadow-strong scale-105' : 'border-border shadow-soft'} bg-gradient-modern-card hover:shadow-strong hover:scale-105 transition-all duration-500`}>
                {plan.savings && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge variant="default" className="bg-gradient-primary text-white shadow-medium">
                      {plan.savings}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center space-y-4 pb-6">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl group-hover:text-primary transition-colors">{plan.name}</CardTitle>
                    <CardDescription className="text-base">{plan.description}</CardDescription>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center space-x-2">
                      <span className="text-4xl lg:text-5xl font-bold text-primary">{plan.currency} {plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      (${plan.priceUSD} USD)
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={plan.popular ? "hero" : "outline"} 
                    className="w-full shadow-soft"
                    size="lg"
                  >
                    Start 14-Day Free Trial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    No credit card required • Cancel anytime
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="space-y-8 text-white max-w-4xl mx-auto">
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
              <Globe2 className="w-4 h-4 mr-2" />
              Join 500+ Organizations Worldwide
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-bold leading-tight">
              Ready to Transform Your 
              <span className="block">Team's Wellness?</span>
            </h2>
            <p className="text-xl lg:text-2xl opacity-90 leading-relaxed">
              Join hundreds of organizations worldwide using StaffPulse to build happier, healthier teams across the globe.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
              <Button variant="secondary" size="lg" className="text-lg px-10 py-6 shadow-strong">
                Start Free Trial - 14 Days
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-10 py-6 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                <Play className="w-5 h-5 mr-2" />
                Schedule Demo
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm opacity-80 pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Free setup & training</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>24/7 customer support</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-foreground text-background">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-medium">
                  <span className="text-white font-bold">SP</span>
                </div>
                <span className="text-2xl font-bold">StaffPulse</span>
              </div>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                Simple employee wellness tracking built for modern organizations worldwide.
                Transform your team's wellness with WhatsApp-based check-ins.
              </p>

            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg">Product</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#features" className="hover:text-background transition-colors hover:underline">Features</a></li>
                <li><a href="#pricing" className="hover:text-background transition-colors hover:underline">Pricing</a></li>
                <li><a href="#" className="hover:text-background transition-colors hover:underline">Demo</a></li>
                <li><a href="#" className="hover:text-background transition-colors hover:underline">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg">Support</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-background transition-colors hover:underline">Help Center</a></li>
                <li><a href="#" className="hover:text-background transition-colors hover:underline">Contact Support</a></li>
                <li><a href="#" className="hover:text-background transition-colors hover:underline">Live Chat Support</a></li>
                <li><a href="#" className="hover:text-background transition-colors hover:underline">Email: support@staffpulse.com</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg">Company</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-background transition-colors hover:underline">About Us</a></li>
                <li><a href="#" className="hover:text-background transition-colors hover:underline">Blog</a></li>
                <li><a href="#" className="hover:text-background transition-colors hover:underline">Careers</a></li>
                <li><a href="#" className="hover:text-background transition-colors hover:underline">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} StaffPulse Ltd. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;