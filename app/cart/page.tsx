"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, setDoc } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { collection, doc, deleteDoc, getDocs, where, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

type CartItem = {
  id: string;
  name: string;
  price: number;
  userId: string;
  serviceId: string;
  createdAt: any;
};

export default function CartPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchCartItems(user.uid);
      } else {
        router.push("/auth/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchCartItems = async (userId: string) => {
    try {
      const q = query(collection(db, "cart"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const items: CartItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data(),
        } as CartItem);
      });
      setCart(items);
    } catch (error) {
      toast.error("Error fetching cart items");
      console.error("Fetch error: ", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartId: string) => {
    try {
      await deleteDoc(doc(db, "cart", cartId));
      setCart(cart.filter((item) => item.id !== cartId));
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error("Error removing item");
      console.error("Remove error: ", error);
    }
  };

  const handleCheckout = async () => {
    try {
      // Create Razorpay order
      const createResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: totalAmount,
          currency: 'INR'
        })
      });
      
      const { id: razorpayOrderId } = await createResponse.json();
  
      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: totalAmount * 100,
        currency: "INR",
        name: "Forever Young",
        order_id: razorpayOrderId,
        handler: async function(response: any) {
          // Verify payment
          await fetch('/api/razorpay/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              orderId: razorpayOrderId,
              paymentId: response.razorpay_payment_id
            })
          });
          
          toast.success('Payment successful!');
          router.push('/history');
        },
        theme: {
          color: '#3399cc'
        }
      };
  
      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.open();
  
    } catch (error) {
      toast.error('Payment initialization failed');
      console.error(error);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-blue-200 to-purple-300 dark:from-blue-900 dark:to-purple-700">
      {/* Added back button container */}
    <div className="flex justify-between items-start mb-6">
      <h1 className="text-3xl font-bold">Your Cart</h1>
      <Button 
        variant="outline"
        onClick={() => router.push("/home")}
        className="text-blue-900 dark:text-white border-blue-900 dark:border-white hover:bg-blue-100 dark:hover:bg-blue-800"
      >
        Back to Home
      </Button>
    </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        {cart.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">Your cart is empty</p>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-600 dark:text-gray-400">₹{item.price}</p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
            
            <div className="border-t pt-4">
              <p className="text-lg font-bold">Total: ₹{totalAmount}</p>
              <Button 
                className="mt-4 w-full bg-blue-800 hover:bg-blue-900 text-white" 
                onClick={handleCheckout}
              >
                Confirm & Pay
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}