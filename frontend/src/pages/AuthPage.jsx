import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Key, Mail, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { auth, google as apiGoogle } from '../services/api.js';
import { useAuthContext } from '../context/AuthContext.jsx';

export default function AuthPage() {
  const { login } = useAuthContext();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle Google OAuth login token callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const urlError = params.get('error');

    if (token) {
      const theme = params.get('theme') || 'dark';
      const plan = params.get('plan') || 'free';
      login(token, { theme, plan }).then(() => {
        localStorage.setItem('resq-current-tab', 'dashboard');
        localStorage.setItem('resq-theme', theme);
        navigate('/dashboard');
      });
    } else if (urlError) {
      setTimeout(() => {
        setError(urlError);
      }, 0);
      // Clean query params from address bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [navigate, login]);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await apiGoogle.getLoginUrl();
      if (response && response.url) {
        window.location.href = response.url;
      } else {
        setError('Could not retrieve Google Login URL.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Google Login Error:', err);
      setError('Failed to initiate Google sign-in.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
 
    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail.endsWith('@gmail.com')) {
        throw new Error('Only valid @gmail.com email addresses are allowed.');
      }

      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!gmailRegex.test(trimmedEmail)) {
        throw new Error('Please enter a valid @gmail.com email address.');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      let data;
      if (isRegister) {
        if (!name.trim()) throw new Error('Name is required');
        data = await auth.register(name, trimmedEmail, password);
      } else {
        data = await auth.login(trimmedEmail, password);
      }

      // Store JWT token and default profile config
      await login(data.token, data);

      // Explicitly set dashboard and theme
      localStorage.setItem('resq-current-tab', 'dashboard');
      localStorage.setItem('resq-theme', data.theme || 'dark');

      // Navigate to dashboard page
      navigate('/dashboard');
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container bg-[#080808] text-white min-h-screen relative bg-noise overflow-hidden flex items-center justify-center font-sans">
      
      {/* Back button to landing */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all duration-300 font-tech text-xs uppercase tracking-wider cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      {/* Background ambient gold/silver glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#E5B842]/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[140px] animate-ambient-glow"></div>
      </div>

      {/* Main glass card */}
      <div className="auth-card w-full max-w-md p-8 mx-4 bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl relative z-10 layered-shadow-xl card-shine-sweep">
        
        {/* Brand Logo header */}
        <div className="text-center mb-8">
          <span className="font-display font-black text-4xl tracking-tighter flex items-center justify-center cursor-pointer mb-2" onClick={() => navigate('/')}>
            <span className="text-silver-gradient text-shine-sweep">Res</span>
            <span className="text-gold-sweep text-glow-gold">Q</span>
          </span>
          <span className="text-sm font-tech font-bold uppercase tracking-[0.2em] text-[#E5B842]">
            Conversational Productivity Shell
          </span>
        </div>

        {/* Form Title & Subtitle */}
        <div className="mb-6 text-center">
          <h3 className="text-xl font-bold tracking-tight text-white/90">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h3>
          <p className="text-sm text-white/70 mt-1">
            {isRegister ? 'Register your productivity node to begin' : 'Sign in to access your cognitive shield'}
          </p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-start gap-2 mb-6 animate-shake">
            <span className="text-sm">⚠️</span>
            <span className="leading-normal">{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block">Full Name</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Enter Full Name"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all"
                />
                <User className="w-4 h-4 text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block">Email Address</label>
            <div className="relative">
              <input 
                type="email"
                placeholder="Enter Email Address"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all"
              />
              <Mail className="w-4 h-4 text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-white/20 outline-none transition-all"
              />
              <Key className="w-4 h-4 text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Form Submit Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 rounded-xl text-sm font-bold tracking-wider uppercase bg-transparent text-white border border-[#E5B842] hover:bg-[#E5B842] hover:text-black shadow-lg shadow-[#E5B842]/5 hover:shadow-[#E5B842]/20 transition-all duration-500 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer font-tech disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Brain className="w-4 h-4 animate-pulse" />
                {isRegister ? 'Initialize Account' : 'Decrypt Session'}
              </>
            )}
          </button>

          {/* Or Divider */}
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="px-3 text-sm font-tech text-white/60 uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wider uppercase bg-[#0B0B0B] hover:bg-[#151515] text-white border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer font-tech disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </form>

        {/* Toggle Form Footer */}
        <div className="mt-8 border-t border-white/5 pt-5 text-center flex flex-col items-center gap-3">
          <p className="text-sm text-white/70">
            {isRegister ? 'Already registered?' : 'New to ResQ?'}
            <button 
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-[#E5B842] hover:text-[#FFF2CC] font-bold uppercase tracking-wider text-sm ml-1.5 focus:outline-none cursor-pointer"
            >
              {isRegister ? 'Sign In' : 'Create Account'}
            </button>
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <a 
              href="/privacy.html" 
              target="_blank" 
              className="text-xs text-white/30 hover:text-white/60 font-tech uppercase tracking-wider transition-colors no-underline"
            >
              Privacy Policy
            </a>
            <span className="text-white/10 text-xs">·</span>
            <a 
              href="/terms.html" 
              target="_blank" 
              className="text-xs text-white/30 hover:text-white/60 font-tech uppercase tracking-wider transition-colors no-underline"
            >
              Terms of Operation
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
