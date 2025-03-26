"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Ensure component runs only on the client side to avoid hydration issues
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

  if (!isClient) return null; // Prevents hydration mismatch issues

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-purple-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-lg shadow-lg rounded-2xl bg-white dark:bg-gray-800 p-6 text-center">
        <CardHeader>
          <CardTitle className="text-5xl font-extrabold text-blue-700 dark:text-blue-300 tracking-wide uppercase">
            Forever Young
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">
            A trusted companion for the elderly, offering essential services like health checkups, 
            grocery assistance, and mental wellness support. We ensure your loved ones receive 
            the best care, anytime, anywhere.
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-lg transition-all duration-200 focus:ring focus:ring-blue-300 dark:focus:ring-blue-500"
            >
              <Link href="/auth/login">Join Us</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}