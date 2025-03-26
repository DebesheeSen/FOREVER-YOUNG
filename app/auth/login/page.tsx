"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, googleProvider, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User detected:", user.uid);
        const userExists = await checkUserInFirestore(user.uid);
        if (userExists) {
          console.log("User exists in Firestore. Redirecting to /home");
          router.push("/home");
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  // ✅ Type Definition for Firestore User Check
  const checkUserInFirestore = async (uid: string): Promise<boolean> => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      return userSnap.exists();
    } catch (error) {
      console.error("Firestore check error:", error);
      return false;
    }
  };

  // ✅ Type Definition for Saving User in Firestore
  interface User {
    uid: string;
    displayName: string | null;
    email: string | null;
  }

  const saveUserToFirestore = async (user: User) => {
    const userRef = doc(db, "users", user.uid);
    try {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || "Anonymous",
        email: user.email,
        createdAt: new Date(),
      });
      console.log("User added to Firestore.");
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  // ✅ Handle Login with Email/Password
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      if (!email.trim() || !password.trim()) {
        setError("Email and password are required.");
        return;
      }

      console.log("Attempting login with:", { email: email.trim(), password });

      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      console.log("Login successful:", user);

      const userExists = await checkUserInFirestore(user.uid);
      if (!userExists) await saveUserToFirestore(user);

      router.push("/home");
    } catch (err: unknown) {
      console.error("Login error:", err);
      if (err instanceof Error) {
        const errorMessages: Record<string, string> = {
          "auth/invalid-credential": "Invalid email or password. Please try again.",
          "auth/user-not-found": "No account found with this email. Please sign up.",
          "auth/wrong-password": "Incorrect password. Try again.",
          "auth/too-many-requests": "Too many failed attempts. Try again later.",
          "auth/network-request-failed": "Network error. Check your connection.",
        };

        setError(errorMessages[err.message] || "Login failed. Try again later.");
      }
    }
  };

  // ✅ Handle Google Login
  const handleGoogleLogin = async () => {
    setError("");

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;

      const userExists = await checkUserInFirestore(user.uid);
      if (!userExists) await saveUserToFirestore(user);

      router.push("/home");
    } catch (err: unknown) {
      console.error("Google sign-in error:", err);
      if (err instanceof Error) {
        const errorMessages: Record<string, string> = {
          "auth/popup-closed-by-user": "Sign-in popup closed. Try again.",
          "auth/cancelled-popup-request": "Multiple popups blocked. Try again.",
          "auth/account-exists-with-different-credential":
            "This email is already linked to another login method.",
          "auth/network-request-failed": "Network error. Check your connection.",
        };

        setError(errorMessages[err.message] || "Google sign-in failed. Try again.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <Card className="w-96 shadow-md bg-white p-6">
        <CardHeader>
          <CardTitle className="text-center text-lg font-semibold">Login</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <Input
                type={passwordVisible ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-3 flex items-center"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Login
            </Button>
          </form>
          <Button
            onClick={handleGoogleLogin}
            className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-black"
            variant="outline"
          >
            Sign in with Google
          </Button>
          <p className="text-center text-sm mt-3">
            Don&rsquo;t have an account?{" "}
            <span
              className="text-blue-500 cursor-pointer"
              onClick={() => router.push("/auth/signup")}
            >
              Sign up
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
