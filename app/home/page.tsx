"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Menu, X } from "lucide-react";

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  cartId?: string;
};

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<Service[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const services: Service[] = [
    { id: "1", name: "Book Mental Health Talks", description: "One-on-one mental health sessions.", price: 500 },
    { id: "2", name: "Book Full Health Checkup", description: "Comprehensive health checkup.", price: 1200 },
    { id: "3", name: "Book Grocery Shopping", description: "Assistance in purchasing groceries.", price: 300 },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push("/auth/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const addToCart = (service: Service) => {
    const cartItem = { ...service, cartId: `${service.id}-${Date.now()}` }; // Unique ID
    setCart((prevCart) => [...prevCart, cartItem]);
    toast.success(`${service.name} added to cart`);
  };

  const removeFromCart = (cartId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartId !== cartId));
    toast.info("Item removed from cart");
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast.info("Logged out successfully");
    router.push("/");
  };
  
  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);


  const proceedToPayment = () => {
    localStorage.setItem("cartItems", JSON.stringify(cart));
    localStorage.setItem("totalAmount", JSON.stringify(totalAmount));
    router.push("/payment");
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-blue-200 to-purple-300 dark:from-blue-900 dark:to-purple-700">
      {/* Responsive Navbar */}
      <nav className="bg-blue-900 dark:bg-blue-950 p-4 rounded-lg shadow-md text-white flex justify-between items-center relative">
        <h1 className="text-3xl font-extrabold tracking-wider uppercase" onClick={() => router.push("/home")}>FOREVER YOUNG</h1>
        
        {/* Hamburger Menu for Mobile */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        {/* Navigation Links */}
        <div className={`absolute md:static top-16 left-0 w-full md:w-auto bg-blue-900 md:bg-transparent md:flex ${menuOpen ? "block" : "hidden"}`}>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 p-4 md:p-0">
            <Button variant="ghost" onClick={() => router.push("/home")} className="text-white">Home</Button>
            <Button variant="ghost" onClick={() => router.push("/history")} className="text-white">History</Button>
            <Button variant="ghost" onClick={() => router.push("/profile")} className="text-white">Profile</Button>
            <Button variant="ghost" onClick={() => router.push("/feedback")} className="text-white">Feedback</Button>
            <Button variant="ghost" onClick={() => router.push("/about")} className="text-white">About Us</Button>
            <Button onClick={handleLogout} variant="destructive">Logout</Button>
          </div>
        </div>
      </nav>
      
      {/* Welcome Message */}
      <div className="mt-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Welcome, {user?.displayName || user?.email || "User"}</h1>
      </div>

      {/* Services Section */}
      <h2 className="text-xl font-semibold mt-6 text-gray-900 dark:text-gray-100">Available Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {services.map((service) => (
          <Card key={service.id} className="bg-white dark:bg-blue-800 shadow-md border border-gray-300 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100 font-medium">{service.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">{service.description}</p>
              <p className="font-bold text-gray-900 dark:text-gray-200">₹{service.price}</p>
              <Button onClick={() => addToCart(service)} className="mt-2 bg-blue-900 dark:bg-purple-700 text-white">Add to Cart</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cart Section */}
      <h2 className="text-xl font-semibold mt-6 text-gray-900 dark:text-gray-100">Cart</h2>
      <div className="border p-4 rounded-md mt-2 bg-white dark:bg-blue-800 shadow-md border-gray-300 dark:border-gray-700">
        {cart.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300">Your cart is empty.</p>
        ) : (
          cart.map((item) => (
            <div key={item.cartId} className="flex justify-between items-center border-b py-2">
              <p className="text-gray-900 dark:text-gray-200">{item.name} - ₹{item.price}</p>
              <Button onClick={() => removeFromCart(item.cartId!)} variant="destructive" className="hover:bg-red-400 text-red-900 hover:text-white-600 px-3 py-1 rounded-md shadow-md">Remove</Button>
            </div>
          ))
        )}
        <p className="mt-4 font-bold text-gray-900 dark:text-gray-100">Total: ₹{totalAmount}</p>
        {cart.length > 0 && <Button className="mt-4 bg-blue-900 text-white w-full" onClick={proceedToPayment}>Confirm & Pay</Button>}
      </div>

      <footer className="mt-10 text-center text-gray-600 dark:text-gray-400">
        &copy; 2025 Forever Young. All rights reserved.
      </footer>
    </div>
  );
}
