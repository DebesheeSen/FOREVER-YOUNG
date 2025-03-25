"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider, db } from "@/lib/firebase";
import { signInWithPopup, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
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

  // Save user data to Firestore
  const saveUserToFirestore = async (user: any, userName: string) => {
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        name: userName || user.displayName || "Anonymous",
        email: user.email,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error saving user to Firestore:", error);
    }
  };

  // Handle Email/Password Sign-Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with name
      await updateProfile(user, { displayName: name });

      // Save user to Firestore
      await saveUserToFirestore(user, name);

      router.push("/home"); // Redirect after successful sign-up
    } catch (err: any) {
      console.error("Signup Error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Email already in use. Please login instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError("Sign-up failed. Please try again.");
      }
    }
  };

  // Handle Google Sign-Up
  const handleGoogleSignUp = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      await saveUserToFirestore(userCredential.user, userCredential.user.displayName || "Google User");
      router.push("/home");
    } catch (err) {
      console.error("Google Sign-Up Error:", err);
      setError("Google Sign-Up failed. Try again.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <Card className="w-96 shadow-md bg-white p-6">
        <CardHeader>
          <CardTitle className="text-center text-lg font-semibold">Sign Up</CardTitle>
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
                className="absolute inset-y-0 right-3 flex items-center"
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
            className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-black"
            variant="outline"
          >
            Sign Up with Google
          </Button>
          <p className="text-center text-sm mt-3">
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
