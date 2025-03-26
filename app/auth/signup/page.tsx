"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider, db } from "@/lib/firebase";
import { signInWithPopup, createUserWithEmailAndPassword, updateProfile, User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app"; // ✅ Import for error handling
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // ✅ Save user data to Firestore
  const saveUserToFirestore = async (user: User, userName: string) => {
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        name: userName || user.displayName || "Anonymous",
        email: user.email,
        createdAt: new Date(),
      });
      console.log("User saved to Firestore:", userName);
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        console.error("Firestore error:", err.message);
      } else {
        console.error("Unexpected error:", err);
      }
      setError("Failed to save user data. Try again.");
    }
  };

  // ✅ Handle Email/Password Sign-Up
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      await saveUserToFirestore(user, name);

      router.push("/home");
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        console.error("Sign-up error:", err.code, err.message);

        const errorMessages: Record<string, string> = {
          "auth/email-already-in-use": "Email already in use. Please login instead.",
          "auth/weak-password": "Password must be at least 6 characters.",
          "auth/invalid-email": "Invalid email format.",
          "auth/network-request-failed": "Network error. Check your connection.",
        };

        setError(errorMessages[err.code] || "Sign-up failed. Try again.");
      } else {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  // ✅ Handle Google Sign-Up
  const handleGoogleSignUp = async () => {
    setError("");

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;

      await saveUserToFirestore(user, user.displayName || "Google User");
      router.push("/home");
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        console.error("Google Sign-Up Error:", err.code, err.message);

        const errorMessages: Record<string, string> = {
          "auth/popup-closed-by-user": "Sign-in popup closed. Try again.",
          "auth/account-exists-with-different-credential":
            "This email is linked to another login method.",
          "auth/network-request-failed": "Network error. Check your connection.",
        };

        setError(errorMessages[err.code] || "Google Sign-Up failed. Try again.");
      } else {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-96 shadow-lg bg-white dark:bg-gray-800 p-6">
        <CardHeader>
          <CardTitle className="text-center text-lg font-semibold text-gray-900 dark:text-white">
            Sign Up
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <form onSubmit={handleSignUp} className="space-y-4">
            <Input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
                aria-label="Toggle password visibility"
                className="absolute inset-y-0 right-3 flex items-center text-gray-600 dark:text-gray-400"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Sign Up
            </Button>
          </form>
          <Button
            onClick={handleGoogleSignUp}
            className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-black dark:bg-gray-700 dark:hover:bg-gray-600"
            variant="outline"
          >
            Sign Up with Google
          </Button>
          <p className="text-center text-sm mt-3 text-gray-700 dark:text-gray-300">
            Already have an account?{" "}
            <span className="text-blue-500 cursor-pointer" onClick={() => router.push("/auth/login")}>
              Login
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
