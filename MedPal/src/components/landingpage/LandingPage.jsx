import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../data/supabase-client.js";
import heroImage from "../../assets/hero-ui.png";
import logo from "../../assets/MedPal2.png";
import voiceIcon from "../../assets/voice-icon.png";
import geminiIcon from "../../assets/gemini-icon.png";
import avatarImage from "../../assets/avatar.png";
import "./landing-page.css";

export default function LandingPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };

    getSession();
  }, []);

  const handleSignOut = async () => {
  await supabase.auth.signOut();
  setUser(null);
};

  return (
    <div className="font-sans text-gray-800 bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center bg-red-700 text-white px-6 py-4">
        <img
          src={logo}
          alt="MedPal Logo"
          className="h-10"
        />

        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-sm">
              Hi, {user.email}
            </span>
            <button
  onClick={handleSignOut}
  className="bg-white text-red-700 font-semibold px-4 py-2 rounded hover:bg-red-100 transition"
>
  Sign Out
</button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="bg-white text-red-700 font-semibold px-4 py-2 rounded hover:bg-red-100 transition"
          >
            Sign In
          </Link>
        )}
      </header>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-center gap-10 px-6 py-16 bg-gradient-to-r from-white to-blue-50">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Your AI Doctor in One Click
          </h1>
          <p className="text-lg mb-6">
            MedPal uses advanced Gemini AI to help you quickly understand your
            symptoms, get personalized health insights, and feel confident about
            your next steps.
          </p>
          <Link
            to="/main"
            className="inline-block bg-red-700 text-white font-semibold px-6 py-3 rounded hover:bg-red-800 transition"
          >
            Try MedPal Free
          </Link>
        </div>
        <div className="max-w-md">
          <img
            src={heroImage}
            alt="MedPal chat interface"
            className="rounded-lg shadow w-1/2 mx-auto"
          />
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-white text-center px-6">
        <h2 className="text-3xl font-bold mb-10">How MedPal Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-blue-50 p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">1. Ask MedPal</h3>
            <p>Describe your symptoms in your own words, anytime.</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">2. Get Instant Insights</h3>
            <p>MedPal delivers fast, AI-powered responses with clear guidance.</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">3. Stay Informed</h3>
            <p>Track symptoms and keep a record of your health history.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50 text-center px-6">
        <div className="flex flex-col md:flex-row justify-center gap-16">
          <div className="max-w-xs mx-auto">
            <img
              src={voiceIcon}
              alt="Voice Technology"
              className="h-12 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">Voice Technology</h3>
            <p>
              AI voice powered by ElevenLabs for ease of use and accessibility.
            </p>
          </div>
          <div className="max-w-xs mx-auto">
            <img
              src={geminiIcon}
              alt="Gemini Powered"
              className="h-12 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">Gemini Powered</h3>
            <p>
              Gemini API ensures fast, reliable, and accurate responses for the
              best diagnosis possible.
            </p>
          </div>
        </div>
      </section>

      {/* User Friendly Section */}
      <section className="flex flex-col md:flex-row items-center justify-center gap-10 px-6 py-16 bg-white">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold mb-4">Extremely User Friendly</h2>
          <p className="mb-4">
            Multiple technologies mesh into one seamless, friendly experience:
          </p>
          <ul className="list-disc list-inside text-left space-y-2">
            <li>3D avatar from ReadyPlayerMe</li>
            <li>Text-to-Speech by ElevenLabs</li>
            <li>Fast responses powered by Google Gemini</li>
          </ul>
        </div>
        <div className="max-w-sm">
          <img
            src={avatarImage}
            alt="MedPal AI Avatar"
            className="rounded-full shadow w-1/2 mx-auto"
          />
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-12 bg-gray-50 text-center px-6">
        <blockquote className="italic text-lg max-w-2xl mx-auto">
          “MedPal helped me quickly understand my symptoms and feel calmer
          before visiting my doctor.”
          <span className="block mt-2 font-semibold">– Alex R.</span>
        </blockquote>
      </section>

      {/* Disclaimer */}
      <section className="bg-red-50 text-red-800 text-center py-6 px-6">
        <p className="text-sm max-w-2xl mx-auto">
          <strong>Disclaimer:</strong> MedPal is an AI tool for informational
          purposes only and is not a substitute for professional medical advice,
          diagnosis, or treatment. Always consult a qualified healthcare provider
          with questions regarding a medical condition.
        </p>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-6 text-sm">
        <div className="space-x-4 mb-2">
          <a href="/privacy" className="hover:underline">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:underline">
            Terms of Use
          </a>
          <a href="/contact" className="hover:underline">
            Contact Us
          </a>
        </div>
        <p>&copy; {new Date().getFullYear()} MedPal. All rights reserved.</p>
      </footer>
    </div>
  );
}
