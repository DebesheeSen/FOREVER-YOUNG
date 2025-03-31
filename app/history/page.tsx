"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

type Order = {
  id: string;
  items: Array<{
    name: string;
    price: number;
    deliveryDate?: Date;
    deliveryTime?: string;
  }>;
  totalAmount: number;
  paymentDate: { seconds: number; nanoseconds: number };
  status: string;
};

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth/login");
      } else {
        setUser(user);
        fetchOrders(user.uid);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchOrders = async (userId: string) => {
    try {
      const q = query(collection(db, "history"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: { seconds: number }) => {
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-blue-200 to-purple-300 dark:from-blue-900 dark:to-purple-700">
      <nav className="bg-blue-900 dark:bg-blue-950 p-4 rounded-lg shadow-md text-white flex justify-between items-center relative">
        <h1 className="text-3xl font-extrabold tracking-wider uppercase" onClick={() => router.push("/home")}>FOREVER YOUNG</h1>
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className={`absolute md:static top-16 left-0 w-full md:w-auto bg-blue-900 md:bg-transparent md:flex ${menuOpen ? "block" : "hidden"}`}>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 p-4 md:p-0">
            <Button variant="ghost" onClick={() => router.push("/home")} className="text-white">Home</Button>
            <Button variant="ghost" onClick={() => router.push("/history")} className="text-white">History</Button>
            <Button variant="ghost" onClick={() => router.push("/profile")} className="text-white">Profile</Button>
            <Button variant="ghost" onClick={() => router.push("/feedback")} className="text-white">Feedback</Button>
            <Button variant="ghost" onClick={() => router.push("/about")} className="text-white">About Us</Button>
            <Button onClick={() => auth.signOut()} variant="destructive">Logout</Button>
          </div>
        </div>
      </nav>

      <div className="mt-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Order History</h1>
      </div>

      <div className="max-w-4xl mx-auto mt-8">
        {loading ? (
          <p className="text-center">Loading your orders...</p>
        ) : orders.length === 0 ? (
          <Card className="text-center p-6">
            <p>No orders found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="bg-white dark:bg-blue-800 shadow-md">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">
                    Order #{order.id.slice(0, 8)} - {formatDate(order.paymentDate)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.name}</span>
                        <span>₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold">₹{order.totalAmount}</span>
                  </div>
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      order.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <footer className="mt-10 text-center text-gray-600 dark:text-gray-400">
        &copy; 2025 Forever Young. All rights reserved.
      </footer>
    </div>
  );
}