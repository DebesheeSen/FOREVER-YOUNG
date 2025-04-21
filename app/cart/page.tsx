/*eslint-disable*/
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { collection, doc, deleteDoc, updateDoc, getDocs, where, query, writeBatch, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type CartItem = {
  id: string;
  name: string;
  price: number;
  userId: string;
  serviceId: string;
  createdAt: any;
};

type OrderStatus = "pending" | "completed" | "failed";

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

  const emptyCart = async () => {
    if (cart.length === 0) return;
    
    try {
      const batch = writeBatch(db);
      cart.forEach(item => {
        const docRef = doc(db, "cart", item.id);
        batch.delete(docRef);
      });
      
      await batch.commit();
      setCart([]);
      toast.success("Cart emptied successfully");
    } catch (error) {
      toast.error("Error emptying cart");
      console.error("Empty cart error: ", error);
    }
  };

  const createOrderInFirestore = async (razorpayOrderId: string): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    
    // First create the order in history with pending status
    const orderId = `order_${Date.now()}`;
    const historyData = {
      orderId,
      userId: user.uid,
      items: cart.map(item => ({
        serviceId: item.serviceId,
        name: item.name,
        price: item.price
      })),
      total: totalAmount,
      status: "pending" as OrderStatus,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "history"), historyData);
    
    // Then create the order in orders collection for payment tracking
    const orderData = {
      userId: user.uid,
      items: cart.map(item => ({
        serviceId: item.serviceId,
        name: item.name,
        price: item.price
      })),
      totalAmount,
      status: "pending" as OrderStatus,
      razorpayOrderId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "orders"), orderData);
    return docRef.id;
  };

  const handleCheckout = async () => {
    try {
      // First add the order to history with pending status
      const tempOrderId = `temp_${Date.now()}`;
      const historyData = {
        orderId: tempOrderId,
        userId: user?.uid,
        items: cart.map(item => ({
          serviceId: item.serviceId,
          name: item.name,
          price: item.price
        })),
        total: totalAmount,
        status: "pending" as OrderStatus,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "history"), historyData);

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

      // Create order in Firestore with pending status
      const orderId = await createOrderInFirestore(razorpayOrderId);
  
      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: totalAmount * 100,
        currency: "INR",
        name: "Forever Young",
        order_id: razorpayOrderId,
        handler: async function(response: any) {
          try {
            // Verify payment
            const verificationResponse = await fetch('/api/razorpay/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                orderId: razorpayOrderId,
                paymentId: response.razorpay_payment_id
              })
            });

            if (!verificationResponse.ok) throw new Error("Payment verification failed");

            // Update order status to completed in both collections
            await updateOrderStatus(orderId, "completed");
            await updateHistoryOrderStatus(tempOrderId, "completed");
            
            toast.success('Payment successful!');
            // Empty cart after successful payment
            await emptyCart();
            router.push('/history');
          } catch (error) {
            // Update order status to failed in both collections
            await updateOrderStatus(orderId, "failed");
            await updateHistoryOrderStatus(tempOrderId, "failed");
            toast.error('Payment verification failed');
            console.error(error);
          }
        },
        theme: {
          color: '#3399cc'
        },
        prefill: {
          name: user?.displayName || '',
          email: user?.email || ''
        }
      };
  
      // @ts-ignore-error
      const rzp = new window.Razorpay(options);
      rzp.open();
  
    } catch (error) {
      toast.error('Payment initialization failed');
      console.error(error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const updateHistoryOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const q = query(collection(db, "history"), where("orderId", "==", orderId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        await updateDoc(doc(db, "history", docId), {
          status,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error updating history order status:", error);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-blue-200 to-purple-300 dark:from-blue-900 dark:to-purple-700">
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
                  className="bg-red-600 hover:bg-red-900"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
            
            <div className="border-t pt-4">
              <p className="text-lg font-bold">Total: ₹{totalAmount}</p>
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900 dark:hover:bg-red-800 dark:text-white"
                  onClick={emptyCart}
                >
                  Empty Cart
                </Button>
                <Button 
                  className="flex-1 bg-blue-800 hover:bg-blue-900 text-white" 
                  onClick={handleCheckout}
                >
                  Confirm & Pay
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}