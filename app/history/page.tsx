"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {toast} from "sonner";

type OrderItem = {
  name: string;
  price: number;
  serviceId: string;
};

type Order = {
  orderId: string;
  userId: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
  status: string;
};

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchOrders(user.uid);
      } else {
        router.push("/auth/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchOrders = async (userId: string) => {
    try {
      const q = query(collection(db, "history"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const ordersData: Order[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ordersData.push({
          orderId: data.orderId,
          userId: data.userId,
          items: data.items || [],
          total: data.total || 0,
          createdAt: data.createdAt,
          status: data.status || "completed"
        });
      });

      setOrders(ordersData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error("Error fetching orders: ", error);
      toast.error("Failed to load order history");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-6">
      <div className="container mx-auto">
        {/* Added back button container */}
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-bold">Order History</h1>
        <Button 
          variant="outline"
          onClick={() => router.push("/home")}
          className="text-blue-900 dark:text-white border-blue-900 dark:border-white hover:bg-blue-100 dark:hover:bg-blue-800"
        >
          Back to Home
        </Button>
      </div>
        
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No orders found</p>
            <Button 
              className="mt-4" 
              onClick={() => router.push("/home")}
            >
              Browse Services
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.orderId} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Order #{order.orderId}</span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      order.status === "completed" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {order.status}
                    </span>
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    {order.items.map((item, index) => (
                      <div key={`${order.orderId}-${index}`} className="flex justify-between">
                        <span className="font-medium">{item.name}</span>
                        <span>₹{item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{order.total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}