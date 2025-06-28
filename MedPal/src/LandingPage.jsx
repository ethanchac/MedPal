import "./LandingPage.css"; // optional: for styles if you prefer external CSS

export default function LandingPage() {
  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <img
          src="/assets/MedPal2.png"
          alt="MedPal Logo"
          style={styles.logo}
        />
        <a href="#start" style={styles.headerButton}>
          Try MedPal Free
        </a>
      </header>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Your AI Doctor in One Click</h1>
          <p style={styles.heroSubtitle}>
            MedPal uses advanced Gemini AI to help you quickly understand your
            symptoms, get personalized health insights, and feel confident about
            your next steps.
          </p>
          <a href="#start" style={styles.ctaButton}>
            Try MedPal Free
          </a>
        </div>
        <div style={styles.heroImageContainer}>
          <img
            src="/assets/hero-ui.png"
            alt="MedPal chat interface"
            style={styles.heroImage}
          />
        </div>
      </section>

      {/* How it Works Section */}
      <section style={styles.howItWorks}>
        <h2 style={styles.sectionTitle}>How MedPal Works</h2>
        <div style={styles.stepsContainer}>
          <div style={styles.step}>
            <h3 style={styles.stepTitle}>1. Ask MedPal</h3>
            <p style={styles.stepText}>
              Describe your symptoms in your own words, anytime.
            </p>
          </div>
          <div style={styles.step}>
            <h3 style={styles.stepTitle}>2. Get Instant Insights</h3>
            <p style={styles.stepText}>
              MedPal delivers fast, AI-powered responses with clear guidance.
            </p>
          </div>
          <div style={styles.step}>
            <h3 style={styles.stepTitle}>3. Stay Informed</h3>
            <p style={styles.stepText}>
              Track symptoms and keep a record of your health history.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.features}>
        <div style={styles.feature}>
          <img
            src="/assets/voice-icon.png"
            alt="Voice Technology"
            style={styles.featureIcon}
          />
          <h3 style={styles.featureTitle}>Voice Technology</h3>
          <p style={styles.featureText}>
            AI voice powered by ElevenLabs for ease of use and accessibility.
          </p>
        </div>

        <div style={styles.feature}>
          <img
            src="/assets/gemini-icon.png"
            alt="Gemini Powered"
            style={styles.featureIcon}
          />
          <h3 style={styles.featureTitle}>Gemini Powered</h3>
          <p style={styles.featureText}>
            Gemini API ensures fast, reliable, and accurate responses for the
            best diagnosis possible.
          </p>
        </div>
      </section>

      {/* User Friendly Section */}
      <section style={styles.userFriendly}>
        <div style={styles.userFriendlyText}>
          <h2 style={styles.sectionTitle}>Extremely User Friendly</h2>
          <p style={styles.sectionText}>
            Multiple technologies mesh into one seamless, friendly experience:
          </p>
          <ul style={styles.list}>
            <li>3D avatar from ReadyPlayerMe</li>
            <li>Text-to-Speech by ElevenLabs</li>
            <li>Fast responses powered by Google Gemini</li>
          </ul>
        </div>
        <div style={styles.avatarImageContainer}>
          <img
            src="/assets/avatar.png"
            alt="MedPal AI Avatar"
            style={styles.avatarImage}
          />
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={styles.testimonial}>
        <blockquote style={styles.quote}>
          “MedPal helped me quickly understand my symptoms and feel calmer
          before visiting my doctor.”
          <span style={styles.quoteAuthor}> – Alex R.</span>
        </blockquote>
      </section>

      {/* Disclaimer */}
      <section style={styles.disclaimer}>
        <p style={styles.disclaimerText}>
          <strong>Disclaimer:</strong> MedPal is an AI tool for informational
          purposes only and is not a substitute for professional medical advice,
          diagnosis, or treatment. Always consult a qualified healthcare
          provider with questions regarding a medical condition.
        </p>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerLinks}>
          <a href="/privacy" style={styles.footerLink}>
            Privacy Policy
          </a>{" "}
          |{" "}
          <a href="/terms" style={styles.footerLink}>
            Terms of Use
          </a>{" "}
          |{" "}
          <a href="/contact" style={styles.footerLink}>
            Contact Us
          </a>
        </p>
        <p style={styles.footerCopyright}>
          &copy; {new Date().getFullYear()} MedPal. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// Inline styles for quick prototyping
const styles = {
  page: {
    fontFamily: "Inter, sans-serif",
    color: "#333",
    lineHeight: "1.6",
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#a4231f",
    color: "#fff",
    padding: "15px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    height: 40,
  },
  headerButton: {
    backgroundColor: "#fff",
    color: "#a4231f",
    textDecoration: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontWeight: "600",
  },
  hero: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    padding: "50px 20px",
    background: "linear-gradient(to right, #ffffff, #f2f8fb)",
  },
  heroContent: {
    maxWidth: 500,
    marginRight: 30,
  },
  heroTitle: {
    fontSize: "2.5rem",
    fontWeight: 700,
    marginBottom: 20,
  },
  heroSubtitle: {
    fontSize: "1.2rem",
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: "#a4231f",
    color: "#fff",
    textDecoration: "none",
    padding: "12px 24px",
    borderRadius: "6px",
    fontWeight: "600",
  },
  heroImageContainer: {
    maxWidth: 400,
    marginTop: 20,
  },
  heroImage: {
    width: "100%",
    borderRadius: "8px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  },
  howItWorks: {
    padding: "50px 20px",
    backgroundColor: "#ffffff",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: "2rem",
    marginBottom: "30px",
  },
  stepsContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "30px",
  },
  step: {
    maxWidth: 250,
    background: "#f2f8fb",
    padding: "20px",
    borderRadius: "8px",
  },
  stepTitle: {
    fontSize: "1.2rem",
    fontWeight: 600,
  },
  stepText: {
    fontSize: "1rem",
  },
  features: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    padding: "50px 20px",
    backgroundColor: "#ffffff",
    gap: "50px",
  },
  feature: {
    maxWidth: 300,
    textAlign: "center",
  },
  featureIcon: {
    height: 50,
    marginBottom: 15,
  },
  featureTitle: {
    fontSize: "1.3rem",
    fontWeight: 600,
    marginBottom: 10,
  },
  featureText: {
    fontSize: "1rem",
  },
  userFriendly: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    padding: "50px 20px",
    backgroundColor: "#f9fafb",
    alignItems: "center",
    gap: "40px",
  },
  userFriendlyText: {
    maxWidth: 400,
  },
  sectionText: {
    fontSize: "1rem",
    marginBottom: "15px",
  },
  list: {
    paddingLeft: "20px",
    fontSize: "1rem",
  },
  avatarImageContainer: {
    maxWidth: 300,
  },
  avatarImage: {
    width: "100%",
    borderRadius: "50%",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  },
  testimonial: {
    backgroundColor: "#ffffff",
    padding: "40px 20px",
    textAlign: "center",
  },
  quote: {
    fontStyle: "italic",
    fontSize: "1.2rem",
  },
  quoteAuthor: {
    display: "block",
    marginTop: "10px",
    fontWeight: 600,
  },
  disclaimer: {
    backgroundColor: "#fff5f5",
    padding: "20px 30px",
    margin: "30px 0",
    textAlign: "center",
    fontSize: "0.9rem",
    color: "#a4231f",
  },
  disclaimerText: {
    margin: 0,
  },
  footer: {
    backgroundColor: "#333",
    color: "#fff",
    padding: "20px",
    textAlign: "center",
  },
  footerLinks: {
    marginBottom: "10px",
  },
  footerLink: {
    color: "#fff",
    textDecoration: "underline",
    margin: "0 8px",
    fontSize: "0.9rem",
  },
  footerCopyright: {
    fontSize: "0.8rem",
  },
};
