import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../services/authService.js';
import { setError } from '../store/slices/authSlice.js';
import { selectIsAuthenticated } from '../store/slices/authSlice.js';
import logo from '../assets/logo.svg';
import FaultyTerminal from '../components/FaultyTerminal';

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.auth);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Redirect if logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clean error on mount
  useEffect(() => {
    dispatch(setError(null));
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!username || !email || !password) {
      setLocalError('All fields are required');
      return;
    }

    if (username.length < 3) {
      setLocalError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    try {
      await dispatch(registerUser({ username, email, password }));
    } catch (err) {
      // Errors handled by Redux auth.error
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased flex flex-col justify-center items-center px-4 py-12 selection:bg-primary/30 selection:text-primary relative grid-bg">
      {/* WebGL FaultyTerminal Background */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
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
      {/* Decorative background elements */}
      <div className="fixed top-1/4 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-1/4 -right-32 w-96 h-96 bg-tertiary-dim/5 rounded-full blur-3xl pointer-events-none"></div>

      <main className="relative z-10 flex flex-col items-center justify-center w-full max-w-[480px]">
        {/* Brand Header */}
        <Link to="/" className="flex items-center gap-3 mb-10 group no-underline outline-none justify-center">
          <img src={logo} alt="SecureChat Logo" className="h-12 w-auto" />
        </Link>

        {/* Glassmorphism Card */}
        <div className="w-full bg-surface-container-high/60 backdrop-blur-xl border border-outline-variant/30 rounded-2xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Top border highlight */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

          {/* Header Section */}
          <div className="mb-8">
            <h1 className="font-headline text-2xl font-bold text-on-surface mb-3 flex items-center gap-2">
              Generate Keychain
              <span className="w-2 h-2 rounded-full bg-primary animate-subtle-pulse shadow-[0_0_8px_rgba(47,243,173,0.8)] inline-block ml-1"></span>
            </h1>
            <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
              Create an identity to generate your post-quantum ML-KEM-1024 cryptographic keys.
            </p>
          </div>

          {/* Error Alert */}
          {(localError || error) && (
            <div className="flex items-start gap-3 p-4 mb-8 rounded-lg bg-error-container/20 border border-error/20 backdrop-blur-sm">
              <span className="material-symbols-outlined text-on-error-container text-[20px] shrink-0 mt-[2px]">error</span>
              <p className="font-code text-xs text-on-error-container leading-snug">
                {localError || error}
              </p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6 flex flex-col">
            {/* Username Input */}
            <div className="space-y-2">
              <label className="font-code text-[11px] text-on-surface-variant flex items-center gap-2 uppercase tracking-widest" htmlFor="username">
                <span className="material-symbols-outlined text-[14px] text-primary/70">terminal</span>
                Username
              </label>
              <div className="relative group border-b border-outline-variant/50 focus-within:border-primary focus-within:shadow-[0_1px_0_0_#2ff3ad] transition-all bg-surface-container-lowest/80 rounded-t-lg">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">alternate_email</span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent border-none text-on-surface font-code text-xs pl-10 pr-4 py-3 focus:outline-none focus:ring-0 placeholder:text-outline-variant/30"
                  placeholder="e.g. alice"
                  disabled={loading}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="font-code text-[11px] text-on-surface-variant flex items-center gap-2 uppercase tracking-widest" htmlFor="email">
                <span className="material-symbols-outlined text-[14px] text-primary/70">mail</span>
                Email Address
              </label>
              <div className="relative group border-b border-outline-variant/50 focus-within:border-primary focus-within:shadow-[0_1px_0_0_#2ff3ad] transition-all bg-surface-container-lowest/80 rounded-t-lg">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">mail</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-none text-on-surface font-code text-xs pl-10 pr-4 py-3 focus:outline-none focus:ring-0 placeholder:text-outline-variant/30"
                  placeholder="name@example.com"
                  disabled={loading}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="font-code text-[11px] text-on-surface-variant flex items-center gap-2 uppercase tracking-widest" htmlFor="password">
                <span className="material-symbols-outlined text-[14px] text-primary/70">key</span>
                Password
              </label>
              <div className="relative group border-b border-outline-variant/50 focus-within:border-primary focus-within:shadow-[0_1px_0_0_#2ff3ad] transition-all bg-surface-container-lowest/80 rounded-t-lg">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">lock</span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-none text-on-surface font-code text-xs pl-10 pr-10 py-3 focus:outline-none focus:ring-0 placeholder:text-outline-variant/30 tracking-widest"
                  placeholder="Min. 8 characters"
                  disabled={loading}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors focus:outline-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dim text-surface-container-lowest font-code text-xs font-bold py-4 px-6 rounded-lg transition-all duration-300 overflow-hidden mt-6 shadow-[0_4px_14px_0_rgba(47,243,173,0.15)] hover:shadow-[0_6px_20px_rgba(47,243,173,0.23)] cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Generating ML-KEM-1024 Keys...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">vpn_key</span>
                  <span>Create Keychain & Keys</span>
                </div>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 text-center pt-6 border-t border-outline-variant/20">
            <Link to="/login" className="inline-flex items-center justify-center gap-2 font-code text-xs text-on-surface-variant hover:text-primary transition-colors group">
              <span>Already registered? Unlock Inbox</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Technical Footer */}
        <div className="mt-8 font-code text-[10px] text-outline-variant text-center opacity-60">
          SECURE SESSION INITIALIZED • END-TO-END ENCRYPTION ACTIVE
        </div>
      </main>
    </div>
  );
};

export default SignUp;
