import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../services/authService.js';
import { setError } from '../store/slices/authSlice.js';
import { selectIsAuthenticated } from '../store/slices/authSlice.js';
import logo from '../assets/logo.svg';
import FaultyTerminal from '../components/FaultyTerminal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error } = useSelector((state) => state.auth);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Redirect if already logged in
  const from = location.state?.from?.pathname || '/chat';
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Clean error state on mount
  useEffect(() => {
    dispatch(setError(null));
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('All fields are required');
      return;
    }

    try {
      await dispatch(loginUser({ email, password }));
    } catch (err) {
      // Errors handled by Redux auth.error
    }
  };

  return (
    <div className="min-h-dvh bg-surface-container-lowest text-on-surface flex flex-col justify-center items-center px-4 selection:bg-primary/30 selection:text-primary relative grid-bg">
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

      <div className="w-full max-w-[440px] flex flex-col gap-8 relative z-10">
        {/* Brand Header */}
        <Link to="/" className="flex items-center justify-center gap-3 group transition-transform duration-300 hover:scale-[1.02]">
          <img src={logo} alt="SecureChat Logo" className="h-12 w-auto" />
        </Link>

        {/* Login Card */}
        <div className="glass-card rounded-xl p-8 flex flex-col gap-6 relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

          <div className="text-center">
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Sign In</h2>
            <p className="font-sans text-xs text-on-surface-variant">
              Enter your credentials to decrypt and access your secure inbox.
            </p>
          </div>

          {/* Error Alert */}
          {(localError || error) && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-error-container/20 border border-error-dim/30">
              <span className="material-symbols-outlined text-error-dim mt-0.5">error</span>
              <p className="font-code text-xs text-on-error-container">
                {localError || error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="font-code text-[11px] text-on-surface-variant flex items-center gap-2 uppercase tracking-widest" htmlFor="email">
                <span className="material-symbols-outlined text-[14px] text-primary/70">terminal</span>
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

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="font-code text-[11px] text-on-surface-variant flex items-center gap-2 uppercase tracking-widest" htmlFor="password">
                  <span className="material-symbols-outlined text-[14px] text-primary/70">key</span>
                  Password
                </label>
              </div>
              <div className="relative group border-b border-outline-variant/50 focus-within:border-primary focus-within:shadow-[0_1px_0_0_#2ff3ad] transition-all bg-surface-container-lowest/80 rounded-t-lg">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">lock</span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-none text-on-surface font-code text-xs pl-10 pr-10 py-3 focus:outline-none focus:ring-0 placeholder:text-outline-variant/30 tracking-widest"
                  placeholder="••••••••"
                  disabled={loading}
                  required
                  autoComplete="current-password"
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
              className="w-full relative overflow-hidden bg-primary text-surface-container-lowest font-code text-xs font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container-lowest disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              {loading ? (
                <span className="relative z-10 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Decrypting Keychain...
                </span>
              ) : (
                <span className="relative z-10 flex items-center gap-2">
                  Unlock Inbox
                  <span className="material-symbols-outlined text-[18px]">lock_open</span>
                </span>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-2 pt-6 border-t border-outline-variant/20 text-center">
            <p className="font-code text-xs text-on-surface-variant">
              New to secure messaging? 
              <Link to="/signup" className="text-primary hover:text-primary-dim hover:underline underline-offset-4 transition-all ml-1">
                Create Keychain
              </Link>
            </p>
          </div>
        </div>

        {/* Technical Footer */}
        <div className="font-code text-[10px] text-outline-variant text-center opacity-60">
          SECURE SESSION INITIALIZED • END-TO-END ENCRYPTION ACTIVE
        </div>
      </div>
    </div>
  );
};

export default Login;
