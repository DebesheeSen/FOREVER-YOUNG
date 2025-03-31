"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { auth, db } from "@/lib/firebase";
import { getDoc, setDoc, doc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

type ProfileData = {
  name: string;
  phones: string; // ✅ Single string, not an array
  address: string;
  bio: string;
  emails: string[];
  age: string;
  healthIssues: string[];
  emergencyContacts: string[];
  profilePicture: string;
};

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    phones: "",
    address: "",
    bio: "",
    emails: [""],
    age: "",
    healthIssues: [""],
    emergencyContacts: [""],
    profilePicture: "",
  });
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        await fetchUserData(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const profileRef = doc(db, "user_profiles", userId);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const data = profileSnap.data() as Partial<ProfileData>;
        setProfileData((prev) => ({
          ...prev,
          ...data,
          emails: data.emails?.length ? data.emails : [""],
          healthIssues: data.healthIssues?.length ? data.healthIssues : [""],
          emergencyContacts: data.emergencyContacts?.length ? data.emergencyContacts : [""],
          phones: data.phones ?? "", // ✅ Handles missing phone number properly
        }));
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index?: number,
    field?: keyof ProfileData
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => {
      if (field && typeof index === "number") {
        return {
          ...prev,
          [field]: Array.isArray(prev[field]) ? prev[field]!.map((item, i) => (i === index ? value : item)) : prev[field],
        };
      } else {
        return {
          ...prev,
          [name]: value,
        };
      }
    });
  };

  const addField = (field: keyof ProfileData) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: Array.isArray(prev[field]) ? [...prev[field]!, ""] : prev[field],
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "user_profiles", user.uid), profileData, { merge: true });
      alert("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Responsive Navbar */}
      <nav className="bg-blue-900 dark:bg-blue-950 p-4 rounded-lg shadow-md text-white flex justify-between items-center relative">
        <h1 className="text-3xl font-extrabold tracking-wider uppercase" onClick={() => router.push("/home")}>FOREVER YOUNG</h1>
        <div className="md:hidden">
          <Button variant="ghost" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
        <div
          className={`absolute md:static top-full left-0 w-full md:w-auto bg-blue-900 dark:bg-blue-950 md:flex md:space-x-4 transition-all duration-300 ${menuOpen ? "block" : "hidden"} md:block`}
        >
          <Button variant="ghost" onClick={() => router.push("/home")} className="text-white w-full md:w-auto">Home</Button>
          <Button variant="ghost" onClick={() => router.push("/history")} className="text-white w-full md:w-auto">History</Button>
          <Button variant="ghost" onClick={() => router.push("/profile")} className="text-white w-full md:w-auto">Profile</Button>
          <Button variant="ghost" onClick={() => router.push("/feedback")} className="text-white w-full md:w-auto">Feedback</Button>
          <Button variant="ghost" onClick={() => router.push("/about")} className="text-white w-full md:w-auto">About Us</Button>
        </div>
      </nav>

      <Card className="max-w-3xl mx-auto mt-6 shadow-lg border dark:border-gray-700">
        <CardHeader className="bg-blue-200 dark:bg-gray-700 p-6 rounded-t-lg">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Manage Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Label className="text-lg font-bold text-gray-800 dark:text-gray-200">Name</Label>
          <Input name="name" value={profileData.name} onChange={handleChange} />

          <Label className="text-lg font-bold text-gray-800 dark:text-gray-200">Phone Number</Label>
          <Input name="phones" value={profileData.phones} onChange={handleChange} /> {/* ✅ Now correctly handles single string */}

          <Label className="text-lg font-bold text-gray-800 dark:text-gray-200">Emails</Label>
          {profileData.emails.map((email, index) => (
            <Input key={index} value={email} onChange={(e) => handleChange(e, index, "emails")} />
          ))}
          <Button onClick={() => addField("emails")} className="bg-gray-300 text-black">Add Email</Button>

          <Label className="text-lg font-bold text-gray-800 dark:text-gray-200">Address</Label>
          <Input name="address" value={profileData.address} onChange={handleChange} />

          <Label className="text-lg font-bold text-gray-800 dark:text-gray-200">Age</Label>
          <Input name="age" value={profileData.age} onChange={handleChange} type="number" />

          <Label className="text-lg font-bold text-gray-800 dark:text-gray-200">Bio</Label>
          <Textarea name="bio" value={profileData.bio} onChange={handleChange} />

          <Label className="text-lg font-bold text-gray-800 dark:text-gray-200">Health Issues</Label>
          {profileData.healthIssues.map((issue, index) => (
            <Input key={index} value={issue} onChange={(e) => handleChange(e, index, "healthIssues")} />
          ))}
          <Button onClick={() => addField("healthIssues")} className="bg-gray-300 text-black">Add Health Issue</Button>

          <Label className="text-lg font-bold text-gray-800 dark:text-gray-200">Emergency Contacts</Label>
          {profileData.emergencyContacts.map((contact, index) => (
            <Input key={index} value={contact} onChange={(e) => handleChange(e, index, "emergencyContacts")} />
          ))}
          <Button onClick={() => addField("emergencyContacts")} className="bg-gray-300 text-black">Add Emergency Contact</Button>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white">
              {loading ? "Saving..." : "Update Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <footer className="text-center text-gray-600 py-6">
        &copy; 2025 Forever Young. All rights reserved.
      </footer>
    </div>
  );
}
