"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      router.push("/home");
    }
  }, [user, router]);

  if (!isClient) return null;

  const services = [
    {
      title: "Health Guardianship",
      icon: "❤️",
      description: "Personalized medical care with regular checkups and medication management"
    },
    {
      title: "Daily Comfort",
      icon: "🛒",
      description: "Grocery shopping, meal prep, and household essentials delivered"
    },
    {
      title: "Mind & Spirit",
      icon: "🧠",
      description: "Therapeutic activities and companionship for mental wellness"
    },
    {
      title: "Home Harmony",
      icon: "🏠",
      description: "Light housekeeping and home maintenance assistance"
    },
    {
      title: "24/7 Safety",
      icon: "🆘",
      description: "Emergency response and regular welfare checks"
    },
    {
      title: "Social Connection",
      icon: "👥",
      description: "Community events and transportation to social gatherings"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5 dark:opacity-10"></div>
        <div className="container mx-auto px-6 py-24 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-8">
              <h1 className="text-5xl md:text-6xl font-bold text-blue-900 dark:text-blue-200 leading-tight">
                FOREVER YOUNG <br />
                <span className="text-purple-600 dark:text-purple-400">For Those Who Shaped Us</span>
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-300">
                Premium elderly care services designed with dignity, respect, and personalized attention.
              </p>
              <div className="flex gap-4">
                <Button
                  asChild
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl transition-all hover:scale-105 shadow-lg"
                >
                  <Link href="/auth/signup">Join Our Family</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-300 dark:text-blue-300 dark:hover:bg-gray-700 px-8 py-6 text-lg rounded-xl transition-all hover:scale-105"
                >
                  <Link href="/auth/login">Member Portal</Link>
                </Button>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-64 h-64 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="relative rounded-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img 
                    src="/image.png" 
                    alt="Happy elderly couple"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-blue-900 dark:text-blue-200 mb-4">
            Our Comprehensive Services
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Every service is tailored to meet the unique needs of our community members
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="p-6">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-2xl font-semibold text-blue-800 dark:text-blue-300 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial Section */}
      <div className="bg-blue-600 dark:bg-blue-900 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <blockquote className="text-2xl md:text-3xl text-white italic mb-8">
              "Forever Young gave my mother the care and companionship she needed. Their team treats her like family, and I finally have peace of mind."
            </blockquote>
            <div className="text-blue-100 dark:text-blue-300 font-medium">
              — Sarah K., Daughter of Client
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-700 dark:to-purple-800 rounded-2xl p-12 text-center shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Experience Compassionate Care?
          </h2>
          <div className="flex justify-center gap-6">
            <Button
              asChild
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg rounded-xl transition-all hover:scale-105 shadow-lg"
            >
              <Link href="/auth/signup">Get Started</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl transition-all hover:scale-105"
            >
              <Link href="/auth/login">Member Login</Link>
            </Button>
          </div>
        </div>
      </div>
      <footer className="text-center text-gray-600 py-6">
        &copy; 2025 Forever Young. All rights reserved.
      </footer>
    </div>
  );
}