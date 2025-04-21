"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

type OrderItem = {
  name: string;
  price: number;
  serviceId: string;
  deliveryDate?: string;
  deliveryTime?: string;
};

type Order = {
  orderId: string;
  userId: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
  status: string;
  paypalOrderId?: string;
  paypalPayerId?: string;
};

export default function PaymentPage() {
  const { orderId } = useParams() as { orderId: string };
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | null>(new Date());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth/login");
      } else {
        setUser(user);
        await fetchOrder(orderId, user.uid);
      }
    });
    return () => unsubscribe();
  }, [router, orderId]);

  const fetchOrder = async (orderId: string, userId: string) => {
    try {
      const docRef = doc(db, "history", orderId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as Order;
        if (data.userId !== userId) {
          toast.error("This order doesn't belong to you");
          router.push("/history");
          return;
        }
        
        setOrder(data);
        if (data.items[0]?.deliveryDate) {
          setDate(new Date(data.items[0].deliveryDate));
        }
      } else {
        toast.error("Order not found");
        router.push("/history");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to load order");
      router.push("/history");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (time: string, index: number) => {
    if (!order) return;
    
    const updatedItems = [...order.items];
    updatedItems[index] = {
      ...updatedItems[index],
      deliveryTime: time
    };
    
    setOrder({
      ...order,
      items: updatedItems
    });
  };

  const createOrder = async (): Promise<string> => {
    try {
      if (!user || !order) throw new Error("Order data missing");
      
      if (order.status === "completed") {
        throw new Error("This order was already paid");
      }

      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: order.total,
          currency: 'INR',
          description: `Order ${order.orderId}`,
          orderId: order.orderId
        }),
      });

      const { id } = await response.json();
      return id;
    } catch (error) {
      console.error("PayPal create order error:", error);
      const message = error instanceof Error ? error.message : "Payment failed";
      toast.error(message);
      throw error;
    }
  };

  const onApprove = async (data: { orderID: string }) => {
    try {
      if (!order) return;
      
      // Update order with payment details and delivery times
      const updatedItems = order.items.map(item => ({
        ...item,
        deliveryDate: date?.toISOString()
      }));

      await updateDoc(doc(db, "history", order.orderId), {
        status: "completed",
        paypalOrderId: data.orderID,
        items: updatedItems,
        updatedAt: serverTimestamp()
      });

      toast.success("Payment completed successfully!");
      router.push("/history");
    } catch (error) {
      console.error("Payment capture error:", error);
      toast.error("Failed to complete payment");
    }
  };

  const onError = (error: Record<string, unknown>) => {
    const errorMessage = typeof error.message === 'string' ? error.message : "Payment failed";
    console.error("PayPal error:", error);
    toast.error(errorMessage);
  };

  if (loading) {
    return <div className="p-6 text-center">Loading order...</div>;
  }

  if (!order) {
    return <div className="p-6 text-center">Order not found</div>;
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-blue-200 to-purple-300 dark:from-blue-900 dark:to-purple-700">
      <nav className="bg-blue-900 dark:bg-blue-950 p-4 rounded-lg shadow-md text-white">
        <h1 className="text-3xl font-extrabold tracking-wider uppercase">FOREVER YOUNG</h1>
      </nav>

      <div className="max-w-4xl mx-auto mt-8">
        <Card className="bg-white dark:bg-blue-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">
              Order #{order.orderId}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.items.map((item, index) => (
              <div key={index} className="mb-6 pb-4 border-b">
                <div className="flex justify-between">
                  <h3 className="font-medium">{item.name}</h3>
                  <span>₹{item.price}</span>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">Delivery Date</label>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        value={date}
                        onChange={setDate}
                      />
                    </LocalizationProvider>
                  </div>
                  
                  <div>
                    <label className="block mb-1">Delivery Time</label>
                    <input
                      type="time"
                      value={item.deliveryTime || "12:00"}
                      onChange={(e) => handleTimeChange(e.target.value, index)}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <span className="font-medium">Total:</span>
              <span className="font-bold">₹{order.total}</span>
            </div>
            
            {order.status === "completed" ? (
              <div className="mt-6 p-4 bg-green-100 rounded-md">
                <p>This order was completed</p>
              </div>
            ) : (
              <div className="mt-6">
                <PayPalScriptProvider options={{ 
                  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                  currency: "INR"
                }}>
                  <PayPalButtons
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={onError}
                  />
                </PayPalScriptProvider>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}