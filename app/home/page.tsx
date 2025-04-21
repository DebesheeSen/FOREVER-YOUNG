/*eslint-disable*/
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth , getDocs, query, where } from "@/lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Menu, X, ShoppingCart } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  icon: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const services: Service[] = [
    { 
      id: "1", 
      name: "Mental Health Talks", 
      description: "One-on-one mental health sessions with certified professionals.", 
      price: 500,
      category: "Health",
      icon: "🧠"
    },
    { 
      id: "2", 
      name: "Full Health Checkup", 
      description: "Comprehensive health checkup including blood tests and doctor consultation.", 
      price: 1200,
      category: "Health",
      icon: "🏥"
    },
    { 
      id: "3", 
      name: "Grocery Shopping", 
      description: "Assistance in purchasing and delivering groceries to your doorstep.", 
      price: 300,
      category: "Daily Needs",
      icon: "🛒"
    },
    { 
      id: "4", 
      name: "Medication Reminder", 
      description: "Daily reminders and assistance with medication management.", 
      price: 200,
      category: "Health",
      icon: "💊"
    },
    { 
      id: "5", 
      name: "Home Cleaning", 
      description: "Professional cleaning service for your home.", 
      price: 600,
      category: "Home Services",
      icon: "🧹"
    },
    { 
      id: "6", 
      name: "Tech Support", 
      description: "Assistance with smartphones, computers, and other devices.", 
      price: 400,
      category: "Technology",
      icon: "💻"
    },
    { 
      id: "7", 
      name: "Companion Visits", 
      description: "Friendly companions for chatting, games, and emotional support.", 
      price: 350,
      category: "Wellness",
      icon: "🤝"
    },
    { 
      id: "8", 
      name: "Yoga & Meditation Sessions", 
      description: "Personalized yoga and meditation sessions for mental and physical well-being.", 
      price: 450,
      category: "Wellness",
      icon: "🧘"
    },
    { 
      id: "9", 
      name: "Travel Plans Booking", 
      description: "Help with booking travel plans, accommodations, and trip organization.", 
      price: 700,
      category: "Travel",
      icon: "✈️"
    },
    { 
      id: "10", 
      name: "Bill Payment Assistance", 
      description: "Help with paying bills online or offline, including reminders.", 
      price: 250,
      category: "Finance",
      icon: "💸"
    },
    { 
      id: "11", 
      name: "Emergency Alert Setup", 
      description: "Installation of emergency alert systems in the house.", 
      price: 800,
      category: "Security",
      icon: "🚨"
    },
    { 
      id: "12", 
      name: "Wheelchair and Mobility Aid Support", 
      description: "Assistance with using wheelchairs or other mobility aids.", 
      price: 300,
      category: "Mobility",
      icon: "🦽"
    },
    { 
      id: "13", 
      name: "Library Book Delivery", 
      description: "Request and receive books from nearby libraries at your home.", 
      price: 150,
      category: "Daily Needs",
      icon: "📚"
    },
    { 
      id: "14", 
      name: "Home Safety Inspection", 
      description: "Inspection of home for safety risks like loose wires, slippery floors, etc.", 
      price: 500,
      category: "Security",
      icon: "🛡️"
    },
    { 
      id: "15", 
      name: "Clothing & Laundry Service", 
      description: "Laundry pickup, cleaning, folding, and return service.", 
      price: 350,
      category: "Home Services",
      icon: "👕"
    },
    { 
      id: "16", 
      name: "Event & Birthday Reminders", 
      description: "Never miss important family birthdays and anniversaries with scheduled reminders.", 
      price: 180,
      category: "Personal Assistance",
      icon: "🎉"
    }
  ];
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchCartCount(user.uid);
      } else {
        router.push("/auth/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchCartCount = async (userId: string) => {
    try {
      const q = query(collection(db, "cart"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      setCartCount(querySnapshot.size);
    } catch (error) {
      console.error("Error fetching cart count: ", error);
    }
  };

  const addToCart = async (service: Service) => {
    if (!user) return;

    try {
      await addDoc(collection(db, "cart"), {
        name: service.name,
        price: service.price,
        userId: user.uid,
        serviceId: service.id,
        createdAt: serverTimestamp()
      });
      toast.success(`${service.name} added to cart`);
      setCartCount(prev => prev + 1);
    } catch (error) {
      toast.error("Failed to add to cart");
      console.error("Error adding to cart: ", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast.info("Logged out successfully");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-6 min-h-screen bg-gray-100 dark:bg-gray-900">

      {/* Responsive Navbar */}
<nav className="bg-blue-900 dark:bg-blue-950 p-4 rounded-lg shadow-md text-white flex justify-between items-center relative">
  <h1 className="text-3xl font-extrabold tracking-wider uppercase" onClick={() => router.push("/home")}>FOREVER YOUNG</h1>
  
  {/* Mobile menu button */}
  <div className="flex items-center gap-4 md:hidden">
    <div className="relative cursor-pointer" onClick={() => router.push("/cart")}>
      <ShoppingCart className="h-6 w-6" />
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </div>
    <Button variant="ghost" onClick={() => setMenuOpen(!menuOpen)} className="p-2">
      {menuOpen ? <X size={24} /> : <Menu size={24} />}
    </Button>
  </div>

  {/* Desktop menu items and cart */}
  <div className="hidden md:flex items-center gap-4">
    <div className="flex space-x-2">
      <Button variant="ghost" onClick={() => router.push("/home")} className="text-white">Home</Button>
      <Button variant="ghost" onClick={() => router.push("/history")} className="text-white">History</Button>
      <Button variant="ghost" onClick={() => router.push("/profile")} className="text-white">Profile</Button>
      <Button variant="ghost" onClick={() => router.push("/feedback")} className="text-white">Feedback</Button>
      <Button variant="ghost" onClick={() => router.push("/about")} className="text-white">About Us</Button>
      <Button onClick={() => auth.signOut()} variant="destructive">Logout</Button>
    </div>
    <div className="relative cursor-pointer" onClick={() => router.push("/cart")}>
      <ShoppingCart className="h-6 w-6" />
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </div>
  </div>

  {/* Mobile menu dropdown */}
  <div className={`absolute top-full left-0 w-full bg-blue-900 dark:bg-blue-950 md:hidden transition-all rounded-b-lg duration-300 ${menuOpen ? "block" : "hidden"}`}>
    <div className="flex flex-col p-2 space-y-2 flex justify-between items-center relative">
      <Button variant="ghost" onClick={() => router.push("/home")} className="text-white justify-start">Home</Button>
      <Button variant="ghost" onClick={() => router.push("/history")} className="text-white justify-start">History</Button>
      <Button variant="ghost" onClick={() => router.push("/profile")} className="text-white justify-start">Profile</Button>
      <Button variant="ghost" onClick={() => router.push("/feedback")} className="text-white justify-start">Feedback</Button>
      <Button variant="ghost" onClick={() => router.push("/about")} className="text-white justify-start">About Us</Button>
    </div>
  </div>
</nav>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.displayName || user?.email?.split('@')[0] || "User"}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Browse our services designed to make your life easier
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{service.icon}</span>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                </div>
                <span className="text-sm text-blue-600 dark:text-blue-400">{service.category}</span>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">{service.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">₹{service.price}</span>
                  <Button 
                    onClick={() => addToCart(service)}
                    className="bg-blue-800 hover:bg-blue-900 text-white"
                  >
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <footer className="mt-10 text-center text-gray-600 dark:text-gray-400">
        &copy; 2025 Forever Young. All rights reserved.
      </footer>
    </div>
  );
}