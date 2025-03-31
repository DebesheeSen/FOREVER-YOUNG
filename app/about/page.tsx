"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { Menu, X } from "lucide-react";

export default function AboutUs() {
  const router = useRouter();

 const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="p-6 min-h-screen bg-white">
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

      {/* Hero Section */}
      <section className="text-center py-16 bg-gradient-to-r from-blue-100 to-purple-200 rounded-lg shadow-md mx-4">
        <h1 className="text-5xl font-extrabold text-gray-900">About Forever Young</h1>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto mt-4">
          Empowering elderly individuals with essential services for a comfortable and independent life.
        </p>
      </section>

      {/* Motivation Section */}
      <section className="py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Motivation</h2>
        <p className="text-lg text-gray-700 bg-blue-50 p-6 rounded-lg shadow-md">
          Many elderly individuals struggle with access to healthcare, social interaction, and daily necessities.
          Forever Young bridges this gap by offering compassionate, reliable, and convenient services tailored to their needs.
        </p>
      </section>

      {/* Our History Section */}
      <section className="py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Our History</h2>
        <p className="text-lg text-gray-700 bg-purple-50 p-6 rounded-lg shadow-md">
          Forever Young began as a small community initiative, driven by a passion for elderly care. Today, we have evolved into a trusted
          platform ensuring senior citizens receive the support they deserve.
        </p>
      </section>

      {/* Meet the Developers Section */}
      <section className="py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet the Developers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-blue-50 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900">Nilanjana Dutta</h3>
            <p className="text-gray-700">Lead Developer</p>
          </div>
          <div className="p-6 bg-purple-50 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900">Debeshee Sen</h3>
            <p className="text-gray-700">Backend Specialist</p>
          </div>
          <div className="p-6 bg-blue-50 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900">Mohak Sarkar</h3>
            <p className="text-gray-700">Frontend Expert</p>
          </div>
          <div className="p-6 bg-purple-50 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900">Saptarshi Nath</h3>
            <p className="text-gray-700">UI/UX Designer</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 text-center bg-gradient-to-r from-purple-100 to-blue-200 rounded-lg shadow-md mx-4">
        <h2 className="text-3xl font-bold text-gray-900">Contact Us</h2>
        <p className="text-lg text-gray-700 flex justify-center items-center mt-4">
          <Mail className="mr-2" /> support@foreveryoung.com
        </p>
        <p className="text-lg text-gray-700 flex justify-center items-center mt-2">
          <Phone className="mr-2" /> +91 98765 43210
        </p>
      </section>

      {/* Footer */}
      <div className="text-center text-gray-600 py-6">
        &copy; 2025 Forever Young. All rights reserved.
      </div>
    </div>
  );
}
