import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Key, EyeOff, Cpu, ArrowRight, Activity, Terminal } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/slices/authSlice.js';
import logo from '../assets/logo.svg';
import FaultyTerminal from '../components/FaultyTerminal';

const LandingPage = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <div className="min-h-dvh bg-background text-on-surface font-sans antialiased overflow-x-hidden selection:bg-primary-container/30 selection:text-primary flex flex-col">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full bg-surface/60 backdrop-blur-xl border-b border-outline-variant/30 z-50">
        <div className="flex justify-between items-center h-20 px-6 max-w-7xl mx-auto">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center outline-none">
            <img src={logo} alt="SecureChat Logo" className="h-10 md:h-12 w-auto" />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to={isAuthenticated ? "/chat" : "/login"} 
              className="text-on-surface-variant font-code text-sm hover:text-primary transition-colors duration-200"
            >
              Features
            </Link>
            <Link 
              to={isAuthenticated ? "/chat" : "/login"} 
              className="text-on-surface-variant font-code text-sm hover:text-primary transition-colors duration-200"
            >
              Specs
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/chat"
                className="bg-primary-container text-black font-code text-xs font-semibold px-6 py-2.5 rounded-full hover:bg-primary transition-all duration-200 active:scale-95 flex items-center gap-2 glow-effect"
              >
                Go to Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link 
                  to="/login" 
                  className="text-on-surface hover:text-primary font-code text-xs transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary-container text-black font-code text-xs font-semibold px-6 py-2.5 rounded-full hover:bg-primary transition-all duration-200 active:scale-95 flex items-center gap-2 glow-effect"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative min-h-dvh flex items-center justify-center pt-32 pb-16 grid-bg overflow-hidden flex-1">
        {/* WebGL FaultyTerminal Background */}
        <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
          <FaultyTerminal
            scale={1.5}
            gridMul={[2, 1]}
            digitSize={1.2}
            timeScale={0.8}
            pause={false}
            scanlineIntensity={0.8}
            glitchAmount={1.0}
            flickerAmount={0.8}
            noiseAmp={1.2}
            chromaticAberration={0.3}
            curvature={0.0}
            tint="#00e5a0"
            mouseReact={true}
            mouseStrength={0.5}
            pageLoadAnimation={false}
            brightness={1.2}
          />
        </div>
        <div className="scanline"></div>
        {/* Subtle radial gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface-container-lowest/20 to-surface-container-lowest pointer-events-none z-10"></div>
        
        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-8">
            <div className="w-2 h-2 rounded-full bg-primary pulse-dot"></div>
            <span className="font-code text-[11px] text-primary tracking-widest uppercase">
              Standardized ML-KEM FIPS-203 Compliant
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl text-on-surface mb-6 max-w-4xl leading-[1.1] tracking-tight">
            Post-Quantum <span className="text-primary">Secure Messaging</span>
          </h1>

          {/* Subheading */}
          <p className="font-sans text-on-surface-variant max-w-2xl mb-10 text-base md:text-lg leading-relaxed">
            Dual-layer encrypted communication powered by CRYSTALS-Kyber key encapsulation and AES-256-GCM. 
            Protect your conversations against harvest-now, decrypt-later attacks.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full justify-center">
            <Link
              to={isAuthenticated ? "/chat" : "/signup"}
              className="w-full sm:w-auto bg-primary text-black font-code text-sm font-bold px-8 py-3.5 rounded-full hover:bg-primary-container transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 glow-effect"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to={isAuthenticated ? "/chat" : "/login"}
              className="w-full sm:w-auto border border-outline-variant text-on-surface hover:text-primary hover:border-primary font-code text-sm px-8 py-3.5 rounded-full transition-colors duration-200 active:scale-95 flex items-center justify-center"
            >
              Sign In
            </Link>
          </div>

          {/* Interactive Cryptographic Handshake Terminal Mockup */}
          <div className="w-full max-w-4xl mx-auto glass-panel rounded-xl p-1 glow-effect">
            <div className="bg-surface-container-lowest/80 rounded-lg p-5 font-code text-left text-xs leading-relaxed text-on-surface-variant">
              {/* Window Controls */}
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3.5 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-error-dim" />
                  <div className="w-3 h-3 rounded-full bg-secondary-dim" />
                  <div className="w-3 h-3 rounded-full bg-primary-dim" />
                </div>
                <span className="text-on-surface-variant/60 text-[10px] tracking-wider uppercase font-semibold">cryptographic_handshake_session.log</span>
                <Terminal className="h-4 w-4 text-primary" />
              </div>
              
              {/* Terminal Logs */}
              <div className="space-y-2 select-none">
                <p className="text-on-surface-variant/40">[info] Initializing crystals-kyber key exchange...</p>
                <p className="text-white">&gt; Generating local ML-KEM-1024 (Kyber-1024) public/private keys</p>
                <p className="text-on-surface-variant/60">[done] Public key registered (1,568 bytes)</p>
                <p className="text-on-surface-variant/40">[info] Encapsulating recipient key pair...</p>
                <p className="text-primary-dim">&gt; Ciphertext length: 1,568 bytes</p>
                <p className="text-secondary">&gt; Shared secret generated (32 bytes) [entropy: ok]</p>
                <p className="text-on-surface-variant/60">[done] HKDF keys derived: messageKey (256-bit), metadataKey (256-bit)</p>
                <p className="text-primary flex items-center gap-2 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  [active] Dual-layer AES-256-GCM message wrapper enabled
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Security Architecture */}
      <section className="py-24 border-t border-outline-variant/20 bg-surface-container-lowest relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
              Security Architecture
            </h2>
            <p className="text-on-surface-variant text-sm max-w-md mx-auto leading-relaxed">
              E2EE is not enough. We protect message contents and metadata from active snooping and quantum computation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-8 rounded-xl flex flex-col justify-between hover:border-primary/50 transition-colors duration-300">
              <div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-headline text-base font-semibold mb-3 text-white">End-to-End Encryption</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Message contents are encrypted client-side using AES-256-GCM. The plaintext never reaches our database.
                </p>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-xl flex flex-col justify-between hover:border-secondary/50 transition-colors duration-300">
              <div>
                <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-6">
                  <EyeOff className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="font-headline text-base font-semibold mb-3 text-white">Metadata Protection</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Layer 2 encryption wraps all metadata (timestamps, sender/recipient IDs) in a second AES-GCM layer.
                </p>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-xl flex flex-col justify-between hover:border-primary/50 transition-colors duration-300">
              <div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Cpu className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-headline text-base font-semibold mb-3 text-white">Post-Quantum Security</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  ML-KEM-1024 provides security margins against quantum-computer decapsulation, satisfying NIST Level 5 standards.
                </p>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-xl flex flex-col justify-between hover:border-tertiary/50 transition-colors duration-300">
              <div>
                <div className="h-10 w-10 rounded-lg bg-tertiary/10 flex items-center justify-center mb-6">
                  <Key className="h-5 w-5 text-tertiary" />
                </div>
                <h3 className="font-headline text-base font-semibold mb-3 text-white">Secure Key Exchange</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Keys are derived via HKDF-SHA256 from a shared secret, ensuring forward secrecy and domain separation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Privacy Features */}
      <section className="py-24 border-t border-outline-variant/20 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-white mb-6">
                Designed for Real-Time Privacy
              </h2>
              <p className="text-on-surface-variant text-sm mb-10 leading-relaxed max-w-xl">
                Enjoy all the conveniences of modern chat apps without sacrificing security. Real-time updates, statuses, and typings are fully relayed and E2E protected.
              </p>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1 h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-headline text-sm font-semibold text-white">Real-Time Messaging</h4>
                    <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                      Instant delivery using persistent Socket.IO connections with JWT authentication.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1 h-8 w-8 rounded bg-secondary/10 flex items-center justify-center">
                    <Key className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-headline text-sm font-semibold text-white">Presence & Typing Status</h4>
                    <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                      Real-time online indicators, last-seen timestamps, and active typing status.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic Code Mockup Card */}
            <div className="glass-panel p-8 rounded-xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
              <div className="space-y-6">
                <div className="flex items-center justify-between text-[10px] font-code text-on-surface-variant/50 pb-3 border-b border-outline-variant/30">
                  <span>SECURE CHAT PROTOCOL</span>
                  <span>ACTIVE SESSION</span>
                </div>
                <div className="space-y-4">
                  <div className="bg-surface-container-lowest/80 p-4 rounded-lg border border-outline-variant/20">
                    <span className="text-on-surface-variant/60 font-code text-[10px] block mb-2 uppercase">Encrypted Payload Stored in DB</span>
                    <code className="text-primary break-all select-all block font-code text-[11px] leading-snug">
                      {"{\"ciphertext\":\"zX9/aK9p...\",\"iv\":\"A8q9Zl==\",\"authTag\":\"Xm9P8==\"}"}
                    </code>
                  </div>
                  <div className="bg-surface-container-lowest/80 p-4 rounded-lg border border-outline-variant/20">
                    <span className="text-on-surface-variant/60 font-code text-[10px] block mb-1.5 uppercase">Decrypted Local View</span>
                    <p className="text-white mt-1 font-sans text-xs leading-relaxed">
                      "Hey Bob, this message is post-quantum secure."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant/20 py-12 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-on-surface-variant font-code">
          <div className="flex items-center gap-3">
            <img src={logo} alt="SecureChat Logo" className="h-6 w-auto opacity-80" />
            <span className="text-on-surface-variant/40">|</span>
            <span>© 2026 SecureChat. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="#" className="hover:text-primary transition-colors">Security Specification</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">FIPS-203 Compliance</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
