/*eslint-disable*/
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection,doc, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Menu, X, Trash2 } from "lucide-react";

type Feedback = {
  id: string;
  userId: string;
  userName: string;
  feedback: string;
  rating: number;
  createdAt: any;
};

export default function FeedbackPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth/login");
      } else {
        setUser(user);
        fetchFeedbacks();
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchFeedbacks = async () => {
    try {
      const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const feedbacksData: Feedback[] = [];
      
      querySnapshot.forEach((doc) => {
        feedbacksData.push({
          id: doc.id,
          ...doc.data(),
        } as Feedback);
      });

      setFeedbacks(feedbacksData);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      toast.error("Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!feedback.trim() || !rating) {
      toast.error("Please provide both feedback and rating");
      return;
    }

    try {
      await addDoc(collection(db, "feedback"), {
        userId: user?.uid,
        userName: user?.displayName || user?.email,
        feedback,
        rating,
        createdAt: serverTimestamp()
      });
      
      toast.success("Thank you for your feedback!");
      setFeedback("");
      setRating(null);
      // Refresh the feedback list
      await fetchFeedbacks();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    }
  };

  const handleDelete = async (feedbackId: string) => {
    try {
      await deleteDoc(doc(db, "feedback", feedbackId));
      toast.success("Feedback deleted successfully");
      await fetchFeedbacks();
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast.error("Failed to delete feedback");
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-blue-200 to-purple-300 dark:from-blue-900 dark:to-purple-700">
      <nav className="bg-blue-900 dark:bg-blue-950 p-4 rounded-lg shadow-md text-white flex justify-between items-center relative">
        <h1 className="text-3xl font-extrabold tracking-wider uppercase" onClick={() => router.push("/home")}>FOREVER YOUNG</h1>
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className={`absolute md:static top-16 left-0 w-full md:w-auto bg-blue-900 md:bg-transparent md:flex ${menuOpen ? "block" : "hidden"}`}>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 p-4 md:p-0">
            <Button variant="ghost" onClick={() => router.push("/home")} className="text-white">Home</Button>
            <Button variant="ghost" onClick={() => router.push("/history")} className="text-white">History</Button>
            <Button variant="ghost" onClick={() => router.push("/profile")} className="text-white">Profile</Button>
            <Button variant="ghost" onClick={() => router.push("/feedback")} className="text-white">Feedback</Button>
            <Button variant="ghost" onClick={() => router.push("/about")} className="text-white">About Us</Button>
            <Button onClick={() => auth.signOut()} variant="destructive">Logout</Button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto mt-8 space-y-8">
        <Card className="bg-white dark:bg-blue-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Share Your Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                How would you rate our service?
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl ${rating && star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Feedback
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What did you like or how can we improve?"
                rows={5}
              />
            </div>
            <Button 
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Submit Feedback
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recent Feedback</h2>
          {loading ? (
            <div className="text-center py-8">Loading feedback...</div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              No feedback yet. Be the first to share!
            </div>
          ) : (
            <div className="grid gap-4">
              {feedbacks.map((item) => (
                <Card key={item.id} className="bg-white dark:bg-blue-800 shadow-sm relative">
                  {user?.uid === item.userId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {item.userName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.createdAt?.toDate?.()?.toLocaleString() || "Recent"}
                        </p>
                      </div>
                      {renderStars(item.rating)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300">{item.feedback}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="mt-10 text-center text-gray-600 dark:text-gray-400">
        &copy; 2025 Forever Young. All rights reserved.
      </footer>
    </div>
  );
}