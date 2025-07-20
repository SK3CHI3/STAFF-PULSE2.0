import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ArrowRight, BarChart3, MessageSquare, Users, Shield, TrendingUp, CheckCircle, Star, Play, Zap, Target, Clock, Award, Globe2, UserPlus, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";

const Index = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "WhatsApp & SMS Integration",
      description: "Reach employees directly through their phones. Works perfectly across Kenya's mobile networks.",
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
      description: "Perfect for small Kenyan teams",
      features: ["Up to 25 employees", "Monthly check-ins", "Basic analytics", "WhatsApp & SMS integration", "Email support"],
      popular: false,
      savings: null
    },
    {
      name: "Business",
      price: "6,500",
      priceUSD: "49",
      currency: "KES",
      description: "For growing Kenyan organizations",
      features: ["Up to 100 employees", "Weekly check-ins", "Advanced analytics", "Department insights", "Priority support", "Custom branding"],
      popular: true,
      savings: "Most Popular"
    },
    {
      name: "Enterprise",
      price: "15,000",
      priceUSD: "115",
      currency: "KES",
      description: "For large Kenyan corporations",
      features: ["Unlimited employees", "Daily check-ins", "Custom analytics", "API access", "Dedicated success manager", "On-site training"],
      popular: false,
      savings: "Best Value"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-page">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-gradient-glass backdrop-blur-md border-b border-border/50 shadow-soft">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SP</span>
              </div>
              <span className="text-xl font-bold text-foreground">StaffPulse</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
              <Button variant="outline" size="sm">Login</Button>
              <Button variant="hero" size="sm">
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Carousel */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-15"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <Carousel
              plugins={[
                Autoplay({
                  delay: 5000,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent>
                {heroSlides.map((slide, index) => (
                  <CarouselItem key={index}>
                    <div className="text-center space-y-8 py-12 animate-fade-in">
                      <div className="space-y-6">
                        <Badge variant="secondary" className="bg-gradient-glass border-primary/20">
                          <Globe2 className="w-4 h-4 mr-2" />
                          Built for Kenya 🇰🇪
                        </Badge>
                        <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                          {slide.title.split(' ').slice(0, -1).join(' ')}
                          <span className="bg-gradient-primary bg-clip-text text-transparent">
                            {' ' + slide.title.split(' ').slice(-1)[0]}
                          </span>
                        </h1>
                        <h2 className="text-2xl lg:text-3xl text-muted-foreground font-medium">
                          {slide.subtitle}
                        </h2>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                          {slide.description}
                        </p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Button variant="hero" size="lg" className="text-lg px-8 shadow-strong">
                          {slide.cta}
                          <ArrowRight className="w-5 h-5" />
                        </Button>
                        <Button variant="outline" size="lg" className="text-lg px-8 bg-gradient-glass border-primary/20">
                          <Play className="w-5 h-5 mr-2" />
                          Watch Demo
                        </Button>
                      </div>

                      <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-success" />
                          <span>No employee accounts needed</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-success" />
                          <span>14-day free trial</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-success" />
                          <span>Kenyan pricing & support</span>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 bg-gradient-glass border-primary/20" />
              <CarouselNext className="right-4 bg-gradient-glass border-primary/20" />
            </Carousel>
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
              Powerful features designed specifically for Kenyan organizations to make employee wellness tracking simple and effective.
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
              Get started in minutes with our simple 3-step process designed for Kenyan businesses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "1",
                title: "Add Your Team",
                description: "Upload employee contact info or add them manually. Works with Kenyan phone numbers and supports all local networks.",
                icon: UserPlus,
                color: "from-blue-500 to-cyan-600"
              },
              {
                step: "2", 
                title: "Send Check-ins",
                description: "Automated WhatsApp/SMS asking 'How are you feeling today?' Perfect for Kenya's mobile-first workforce.",
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
            <h2 className="text-4xl lg:text-5xl font-bold">Loved by Kenyan HR Teams</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how organizations across Kenya are improving team wellness with StaffPulse
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
            <h2 className="text-4xl lg:text-5xl font-bold">Kenyan Pricing</h2>
            <h3 className="text-4xl lg:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">Made Affordable</h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Transparent pricing in Kenyan Shillings with no hidden fees. All plans include free setup and training.
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
              Join 500+ Kenyan Organizations
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-bold leading-tight">
              Ready to Transform Your 
              <span className="block">Team's Wellness?</span>
            </h2>
            <p className="text-xl lg:text-2xl opacity-90 leading-relaxed">
              Join hundreds of Kenyan organizations using StaffPulse to build happier, healthier teams across Nairobi, Mombasa, Kisumu, and beyond.
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
                <span>Kenyan customer support</span>
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
                Simple employee wellness tracking built specifically for Kenyan organizations. 
                Transform your team's wellness with WhatsApp-based check-ins.
              </p>
              <div className="space-y-2">
                <p className="font-semibold">🇰🇪 Proudly serving Kenya</p>
                <p className="text-sm text-muted-foreground">
                  Nairobi • Mombasa • Kisumu • Nakuru • Eldoret
                </p>
              </div>
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
                <li><a href="#" className="hover:text-background transition-colors hover:underline">WhatsApp: +254 700 000 000</a></li>
                <li><a href="#" className="hover:text-background transition-colors hover:underline">Email: support@staffpulse.co.ke</a></li>
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
              © 2024 StaffPulse Kenya Ltd. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span>Made with ❤️ in Kenya</span>
              <span>•</span>
              <span>🇰🇪 Kenyan Owned & Operated</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;