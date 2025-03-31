"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  cartId?: string;
  deliveryDate?: Date;
  deliveryTime?: string;
};

export default function PaymentPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<Service[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedTime] = useState<string>("12:00");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | null>(new Date());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth/login");
      } else {
        setUser(user);
        // Load cart items from local storage
        const savedCart = localStorage.getItem("cartItems");
        const savedTotal = localStorage.getItem("totalAmount");
        
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
        if (savedTotal) {
          setTotalAmount(JSON.parse(savedTotal));
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleDateChange = (date: Date | undefined, cartId: string) => {
    if (!date) return;
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.cartId === cartId ? { ...item, deliveryDate: date } : item
      )
    );
  };

  const handleTimeChange = (time: string, cartId: string) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.cartId === cartId ? { ...item, deliveryTime: time } : item
      )
    );
  };

  const createOrder = async () => {
    try {
      // First create the order in Firestore (with status 'pending')
      const paymentData = {
        userId: user?.uid,
        userName: user?.displayName || user?.email,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          deliveryDate: item.deliveryDate,
          deliveryTime: item.deliveryTime
        })),
        totalAmount,
        paymentDate: serverTimestamp(),
        status: "pending"
      };

      // Add to history collection
      const docRef = await addDoc(collection(db, "history"), paymentData);
      setOrderId(docRef.id);

      // Create PayPal order
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'USD',
          description: 'Forever Young Services'
        }),
      });

      const { id } = await response.json();
      return id;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };

  const onApprove = async (data: { orderID: string }) => {
    try {
      // Capture the payment
      const response = await fetch(`/api/paypal/capture-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderID: data.orderID
        }),
      });

      const result = await response.json();

      if (result.status === 'COMPLETED' && orderId) {
        // Update Firestore document to 'completed'
        await updateDoc(doc(db, "history", orderId), {
          status: "completed",
          paypalOrderId: data.orderID,
          paypalPayerId: result.payer.payer_id,
          updatedAt: serverTimestamp()
        });
        
        toast.success("Payment successful! Your services are booked.");
        localStorage.removeItem("cartItems");
        localStorage.removeItem("totalAmount");
        router.push("/history");
      }
    } catch (error) {
      console.error("Error capturing payment:", error);
      toast.error("Payment failed. Please try again.");
    }
  };

  const onError = (err: any) => {
    console.error("PayPal error:", err);
    toast.error("Payment failed. Please try again.");
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-blue-200 to-purple-300 dark:from-blue-900 dark:to-purple-700">
      <nav className="bg-blue-900 dark:bg-blue-950 p-4 rounded-lg shadow-md text-white">
        <h1 className="text-3xl font-extrabold tracking-wider uppercase" onClick={() => router.push("/home")}>FOREVER YOUNG</h1>
      </nav>

      <div className="mt-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Payment</h1>
      </div>

      <div className="max-w-4xl mx-auto mt-8">
        <Card className="bg-white dark:bg-blue-800 shadow-md border border-gray-300 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100 font-medium">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {cart.map((item) => (
              <div key={item.cartId} className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-200">{item.name}</h3>
                    <p className="text-gray-700 dark:text-gray-400">₹{item.price}</p>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Delivery Date
                    </label>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker 
                            value={date}
                            onChange={(newValue) => setDate(newValue)}
                        />
                    </LocalizationProvider>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Delivery Time
                    </label>
                    <input
                      type="time"
                      value={item.deliveryTime || selectedTime}
                      onChange={(e) => handleTimeChange(e.target.value, item.cartId!)}
                      className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="font-medium text-gray-900 dark:text-gray-200">Total Amount:</span>
              <span className="font-bold text-lg text-gray-900 dark:text-gray-100">₹{totalAmount}</span>
            </div>
            
            <div className="mt-6">
              <PayPalScriptProvider options={{ 
                "clientId": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                currency: "USD",
                intent: "capture"
              }}>
                <PayPalButtons 
                  style={{ layout: "vertical" }}
                  createOrder={createOrder}
                  onApprove={onApprove}
                  onError={onError}
                  disabled={loading || cart.some(item => !item.deliveryDate || !item.deliveryTime)}
                />
              </PayPalScriptProvider>
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-10 text-center text-gray-600 dark:text-gray-400">
        &copy; 2025 Forever Young. All rights reserved.
      </footer>
    </div>
  );
}