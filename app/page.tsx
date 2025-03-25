"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        router.push("/home");
      }
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-purple-100 px-4">
      <Card className="w-full max-w-lg shadow-lg rounded-2xl bg-white p-6 text-center">
        <CardHeader>
          <CardTitle className="text-5xl font-extrabold text-blue-700 tracking-wide uppercase">
            Forever Young
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-gray-700 mt-2">
            A trusted companion for the elderly, offering essential services like health checkups, 
            grocery assistance, and mental wellness support. We ensure your loved ones receive 
            the best care, anytime, anywhere.
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-lg">
              <Link href="/auth/login">Join Us</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}