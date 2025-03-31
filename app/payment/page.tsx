"use client";

import { useState, useEffect } from "react";
import { useRouter ,useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Define the type for service items
type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export default function ConfirmPayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<Service[]>(
    JSON.parse(searchParams.get("cartItems") || "[]")
  );
  const [totalPrice, setTotalPrice] = useState<number>(
    parseFloat(searchParams.get("totalPrice") || "0")
  );
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");

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

  const handlePayment = () => {
    if (!user || cart.length === 0 || !deliveryDate || !deliveryTime) {
      toast.error("Please complete all details before proceeding.");
      return;
    }

    setCart([]);
    toast.success("Order placed successfully!");
    router.push("/success");
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100 dark:bg-gray-900">
      <h1 className="text-2xl font-bold text-center">Confirm & Pay</h1>
      <div className="mt-6">
        {cart.length === 0 ? (
          <p className="text-center text-gray-500">Your cart is empty.</p>
        ) : (
          cart.map((item) => (
            <Card key={item.id} className="mb-4">
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{item.description}</p>
                <p className="font-bold">₹{item.price}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <div className="mt-6">
        <label className="block text-sm font-medium">Select Delivery Date:</label>
        <input
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="w-full p-2 border rounded-md"
        />
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium">Select Delivery Time:</label>
        <input
          type="time"
          value={deliveryTime}
          onChange={(e) => setDeliveryTime(e.target.value)}
          className="w-full p-2 border rounded-md"
        />
      </div>
      <p className="mt-4 font-bold text-lg">Total: ₹{totalPrice}</p>
      <Button onClick={handlePayment} className="mt-4 bg-blue-900 text-white w-full">
        Pay Now
      </Button>
    </div>
  );
}
