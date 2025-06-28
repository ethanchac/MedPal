import React, { useState, useEffect } from "react";
import { supabase } from "../../../data/supabase-client";
import VoiceSettings from "./VoiceSettings";

function Header({ isSidebarOpen, isSidebarCollapsed, voiceSettingsProps }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Error getting session:", error);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Dynamically adjust padding based on sidebar state
  const getPaddingLeft = () => {
    if (!isSidebarOpen) {
      return "pl-6"; // No sidebar
    }
    return isSidebarCollapsed ? "pl-16" : "pl-80"; // Collapsed or full sidebar
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 h-16 bg-white shadow z-40 flex items-center justify-between px-6 ${getPaddingLeft()} transition-all duration-300`}
    >
      {/* Left side - Voice Settings */}
      <div className="flex items-center">
        {voiceSettingsProps && <VoiceSettings {...voiceSettingsProps} />}
      </div>

      {/* Right side - User info */}
      {user && (
        <div className="flex items-center gap-4">
          <button
            onClick={handleSignOut}
            className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
          >
            Sign Out
          </button>
          {user.user_metadata?.picture && (
            <img
              src={user.user_metadata.picture}
              alt="User"
              className="w-8 h-8 rounded-full"
            />
          )}
        </div>
      )}
    </header>
  );
}

export default Header;