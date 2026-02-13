import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  Award,
  TrendingUp,
  ArrowRight,
  Star,
  Zap,
  Target,
  Globe,
  Clock,
  CheckCircle2,
  Play,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

const Home = () => {
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Learn at Your Pace",
      description:
        "Self-paced courses that fit your schedule. Learn anytime, anywhere.",
      color: "from-yellow-400 to-orange-500",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Expert Instructors",
      description:
        "Learn from industry professionals with years of real-world experience.",
      color: "from-blue-400 to-purple-500",
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Verified Certificates",
      description:
        "Earn recognized certificates to showcase your achievements.",
      color: "from-green-400 to-teal-500",
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Project-Based Learning",
      description: "Build real projects and add them to your portfolio.",
      color: "from-pink-400 to-red-500",
    },
  ];

  const stats = [
    {
      number: "10K+",
      label: "Active Students",
      icon: <Users className="h-6 w-6" />,
    },
    {
      number: "500+",
      label: "Courses",
      icon: <BookOpen className="h-6 w-6" />,
    },
    {
      number: "200+",
      label: "Expert Instructors",
      icon: <Award className="h-6 w-6" />,
    },
    {
      number: "98%",
      label: "Success Rate",
      icon: <TrendingUp className="h-6 w-6" />,
    },
  ];

  const categories = [
    { name: "Web Development", courses: 120, icon: "💻", color: "bg-blue-500" },
    { name: "Data Science", courses: 85, icon: "📊", color: "bg-purple-500" },
    { name: "Mobile Apps", courses: 65, icon: "📱", color: "bg-green-500" },
    { name: "UI/UX Design", courses: 90, icon: "🎨", color: "bg-pink-500" },
    {
      name: "Digital Marketing",
      courses: 75,
      icon: "📈",
      color: "bg-orange-500",
    },
    { name: "Cloud Computing", courses: 55, icon: "☁️", color: "bg-cyan-500" },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Developer",
      image: "https://i.pravatar.cc/150?img=1",
      text: "This platform transformed my career. The courses are top-notch and the instructors are incredibly knowledgeable.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Data Analyst",
      image: "https://i.pravatar.cc/150?img=2",
      text: "Best investment in my education. I went from beginner to landing my dream job in just 6 months!",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "UX Designer",
      image: "https://i.pravatar.cc/150?img=3",
      text: "The project-based approach helped me build a portfolio that impressed employers. Highly recommended!",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section - Modern Gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 dark:from-primary-900 dark:via-purple-900 dark:to-pink-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-white/10 dark:bg-white/5 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="container-custom relative z-10 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-white space-y-8 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">
                  🎉 New courses added weekly
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                Master New Skills
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">
                  Transform Your Future
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-white/90 dark:text-white/80">
                Join thousands of learners worldwide. Access expert-led courses,
                earn certificates, and accelerate your career.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/courses"
                  className="group px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 shadow-2xl"
                >
                  Explore Courses
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/register"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white hover:text-primary-600 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Play className="h-5 w-5" />
                  Watch Demo
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold">50K+</div>
                  <div className="text-white/80 dark:text-white/70">
                    Students
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-white/80 dark:text-white/70">
                    Courses
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold">4.9★</div>
                  <div className="text-white/80 dark:text-white/70">Rating</div>
                </div>
              </div>
            </div>

            {/* Right Content - Image/Graphic */}
            <div className="relative animate-fade-in">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=600&fit=crop"
                  alt="Students learning"
                  className="rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
                />
                {/* Floating Card */}
                <div className="absolute -bottom-6 -left-6 glass rounded-2xl p-4 shadow-2xl animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-gray-100">
                        1,234 Students
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Enrolled this week
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-gray-50 dark:bg-dark-900">
        <div className="container-custom">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Why Choose <span className="gradient-text">Our Platform</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to succeed in your learning journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`card-hover group ${hoveredFeature === index ? "scale-105" : ""}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section bg-white dark:bg-dark-950">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Explore by <span className="gradient-text">Category</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Choose from our most popular categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={`/courses?category=${category.name}`}
                className="card-hover text-center p-6 group"
              >
                <div
                  className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  {category.icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {category.courses} courses
                </p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/courses" className="btn-outline">
              View All Categories
              <ArrowRight className="inline-block ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-900 dark:to-purple-900">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 dark:bg-white/10 rounded-2xl mb-4">
                  {stat.icon}
                </div>
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-lg text-white/90 dark:text-white/80">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section bg-gray-50 dark:bg-dark-900">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Student <span className="gradient-text">Success Stories</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              See what our students are saying
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card-hover">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-white dark:bg-dark-950">
        <div className="container-custom">
          <div className="glass rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-purple-600/10 dark:from-primary-900/20 dark:to-purple-900/20"></div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                Ready to Start Your Learning Journey?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Join thousands of students already learning on our platform.
                Start for free today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="btn-primary text-lg">
                  Get Started Free
                  <ArrowRight className="inline-block ml-2 h-5 w-5" />
                </Link>
                <Link to="/courses" className="btn-outline text-lg">
                  Browse Courses
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
