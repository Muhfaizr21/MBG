import React, { useState } from 'react'
import loginArt from '../assets/login-art.png'

export function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      alert(`Pendaftaran berhasil untuk ${name} (${email})! Silakan masuk.`)
      window.location.href = '/login'
    }, 600)
  }

  return (
    <div className="h-screen max-h-screen w-full overflow-hidden relative bg-white selection:bg-black selection:text-white">
      {/* Artwork Anchored at Top-Right Corner (Pojok Kanan Atas, Pure White Seamless) */}
      <div className="hidden lg:block absolute top-0 right-0 z-0 pointer-events-none select-none overflow-hidden">
        <img
          src={loginArt}
          alt="Halftone Dither Art"
          className="w-[300px] lg:w-[360px] xl:w-[420px] max-h-[62vh] object-contain object-top object-right"
        />
      </div>

      {/* Main Content (Full Height, Pure White, No Scroll) */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12 overflow-hidden bg-transparent">
        
        {/* Top Header: Back Button */}
        <div className="flex items-center justify-between w-full shrink-0">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-gray-500 hover:text-black hover:bg-gray-100 border border-gray-200 transition duration-150"
          >
            <span>←</span> Kembali ke Beranda
          </a>
        </div>

        {/* Center: Register Form Container (Enlarged, perfectly balanced) */}
        <div className="w-full max-w-[440px] sm:max-w-[460px] lg:max-w-[480px] my-auto py-3 sm:py-5 shrink-0 lg:ml-12 xl:ml-24">
          {/* Minimalist Geometric Logo Mark */}
          <div className="w-9 h-9 text-black flex items-center justify-start mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 3L2 14L9 11L14 3H7Z" />
              <path d="M15 11L10 22L17 19L22 11H15Z" />
            </svg>
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Create an Account
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-mono mt-1.5 mb-4">
            Join KawanGizi to access your food freshness dashboard
          </p>

          {/* Social Signup Buttons */}
          <div className="space-y-2.5">
            {/* Google Button */}
            <button
              type="button"
              onClick={() => alert('Sign up with Google')}
              className="w-full flex items-center justify-center gap-3 py-2.5 sm:py-3 px-5 rounded-full border border-gray-200 text-xs sm:text-sm font-mono text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition duration-150 shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.09C3.25 21.34 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.27C.46 8.21 0 10.04 0 12s.46 3.79 1.27 5.41l4.01-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.66 1.27 6.59l4.01 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
                />
              </svg>
              Sign up with Google
            </button>

            {/* Apple Button */}
            <button
              type="button"
              onClick={() => alert('Sign up with Apple')}
              className="w-full flex items-center justify-center gap-3 py-2.5 sm:py-3 px-5 rounded-full border border-gray-200 text-xs sm:text-sm font-mono text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition duration-150 shadow-xs"
            >
              <svg className="w-4 h-4 fill-current text-black" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 1.01-2.85-.9.04-2 .6-2.65 1.35-.58.65-1.09 1.71-1.04 2.74 1.01.08 2.05-.49 2.68-1.24z" />
              </svg>
              Sign up with Apple
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-3.5 flex items-center justify-center">
            <div className="w-full border-t border-gray-200"></div>
            <span className="absolute bg-white px-3 text-[11px] uppercase font-mono text-gray-400 tracking-wider">
              OR
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-mono font-medium text-gray-800 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-sans rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-mono font-medium text-gray-800 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-sans rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-mono font-medium text-gray-800 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Create a password (min. 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-2 sm:py-2.5 text-xs sm:text-sm font-sans rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitted}
              className="w-full mt-4 py-3 sm:py-3.5 bg-black text-white text-xs sm:text-sm font-mono font-medium rounded-full hover:bg-gray-800 active:scale-[0.99] transition duration-150 shadow-md disabled:opacity-70"
            >
              {submitted ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Bottom Footer */}
        <p className="text-xs sm:text-sm text-gray-400 font-mono py-1 shrink-0 lg:ml-12 xl:ml-24">
          Already have an account?
          <a
            href="/login"
            className="text-gray-900 font-semibold underline underline-offset-2 hover:text-black ml-1.5"
          >
            Sign In
          </a>
        </p>
      </div>
    </div>
  )
}
