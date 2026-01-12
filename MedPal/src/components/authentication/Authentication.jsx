import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../../data/firebase-client.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import { Heart, Mic, Brain, Sparkles, Zap, Shield, Clock } from 'lucide-react';

export default function Authentication() {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("signin");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check authentication status on mount and listen for auth changes
  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/main");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setMessage("");
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      setFormData({ email: "", password: "", confirmPassword: "" });
      setMessage("Successfully signed in!");
      navigate("/main");
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      setFormData({ email: "", password: "", confirmPassword: "" });
      setMessage("Account created successfully!");
      navigate("/main");
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/main");
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-50 overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 -left-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        />
        <div
          className="absolute bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"
          style={{ transform: `translateY(${scrollY * -0.2}px)`, animationDelay: '1s' }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-[#DC143C] to-[#B0101C] rounded-xl flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            MedPal
          </span>
        </div>
        <button
          onClick={() => setShowAuthModal(true)}
          className="px-6 py-2.5 bg-gradient-to-r from-[#DC143C] to-[#B0101C] text-white rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-gray-200 shadow-sm mb-6">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">AI-Powered Medical Consultation</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Your Personal
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#DC143C] via-[#FF1744] to-[#DC143C] bg-clip-text text-transparent">
              AI Doctor
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Get instant, accurate medical diagnoses from Dr. Theresa - your AI physician with 90%+ diagnostic accuracy across 500+ consultations.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-[#DC143C] to-[#B0101C] text-white rounded-full font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            >
              Start Free Consultation
            </button>
            <button className="px-8 py-4 bg-white text-gray-800 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-200">
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12 mt-16">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-[#DC143C] to-[#B0101C] bg-clip-text text-transparent">90%+</div>
              <div className="text-sm text-gray-600 mt-1">Diagnostic Accuracy</div>
            </div>
            <div className="w-px h-12 bg-gray-300" />
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-[#DC143C] to-[#B0101C] bg-clip-text text-transparent">500+</div>
              <div className="text-sm text-gray-600 mt-1">Consultations</div>
            </div>
            <div className="w-px h-12 bg-gray-300" />
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-[#DC143C] to-[#B0101C] bg-clip-text text-transparent">24/7</div>
              <div className="text-sm text-gray-600 mt-1">Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose MedPal?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Advanced AI technology meets compassionate medical care
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Brain,
              title: "AI-Powered Diagnosis",
              description: "Advanced diagnostic methodology with pattern recognition and differential analysis",
              color: "from-blue-500 to-cyan-500"
            },
            {
              icon: Mic,
              title: "Voice-First Interface",
              description: "Natural conversation mode with hands-free operation and real-time responses",
              color: "from-purple-500 to-pink-500"
            },
            {
              icon: Heart,
              title: "3D Avatar Interaction",
              description: "Talk to Dr. Theresa with realistic facial expressions and lip-synced speech",
              color: "from-red-500 to-orange-500"
            },
            {
              icon: Zap,
              title: "Instant Results",
              description: "Get specific diagnoses and treatment plans in seconds, not hours",
              color: "from-yellow-500 to-orange-500"
            },
            {
              icon: Shield,
              title: "Privacy First",
              description: "Your medical data is encrypted and stored securely with row-level security",
              color: "from-green-500 to-emerald-500"
            },
            {
              icon: Clock,
              title: "24/7 Availability",
              description: "No appointments needed - access medical consultation anytime, anywhere",
              color: "from-indigo-500 to-purple-500"
            }
          ].map((feature, idx) => (
            <div
              key={idx}
              className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get diagnosed in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Describe Your Symptoms",
              description: "Tell Dr. Theresa what you're experiencing through voice or text"
            },
            {
              step: "02",
              title: "AI Analysis",
              description: "Our advanced AI performs differential diagnosis using medical reasoning"
            },
            {
              step: "03",
              title: "Get Treatment Plan",
              description: "Receive specific diagnosis and actionable treatment recommendations"
            }
          ].map((item, idx) => (
            <div key={idx} className="relative">
              {idx < 2 && (
                <div className="hidden md:block absolute top-1/4 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent -z-10" />
              )}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="text-6xl font-bold text-gray-100 mb-4">{item.step}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-[#DC143C] to-[#B0101C] rounded-3xl p-12 text-center shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands who trust MedPal for instant, accurate medical consultations
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-10 py-4 bg-white text-[#DC143C] rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            Start Your Free Consultation
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-[#DC143C] to-[#B0101C] rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-gray-900">MedPal</span>
          </div>
          <p className="text-sm">
            © 2024 MedPal. AI-powered medical consultation platform.
          </p>
          <p className="text-xs mt-2 text-gray-500">
            MedPal is not a substitute for professional medical advice. Always consult with a healthcare provider.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative animate-scale-in">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#DC143C] to-[#B0101C] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Heart className="w-8 h-8 text-white" fill="currentColor" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                {authMode === "signin" ? "Welcome Back" : "Get Started"}
              </h2>
              <p className="text-gray-600 mt-2">
                {authMode === "signin" ? "Sign in to continue" : "Create your free account"}
              </p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 mb-6"
            >
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
                className="w-5 h-5"
              />
              <span className="font-semibold text-gray-700">
                {authMode === "signin" ? "Sign in with Google" : "Sign up with Google"}
              </span>
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or continue with email</span>
              </div>
            </div>

            <form
              onSubmit={authMode === "signin" ? handleSignIn : handleSignUp}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#DC143C] focus:outline-none transition-colors disabled:opacity-50"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#DC143C] focus:outline-none transition-colors disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>

              {authMode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#DC143C] focus:outline-none transition-colors disabled:opacity-50"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#DC143C] to-[#B0101C] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
              >
                {loading ? "Loading..." : authMode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <button
              onClick={() => {
                setAuthMode(authMode === "signin" ? "signup" : "signin");
                setError("");
                setMessage("");
              }}
              disabled={loading}
              className="w-full mt-4 text-sm text-gray-600 hover:text-[#DC143C] transition-colors disabled:opacity-50"
            >
              {authMode === "signin"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                {message}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
