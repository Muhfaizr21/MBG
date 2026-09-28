import React, { useState, useEffect } from 'react'
import spaceBg from '../assets/space-404.jpg'
import { navigate } from '../App'

export function NotFoundPage({ path }) {
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (countdown <= 0) {
      navigate('/')
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  return (
    <div className="relative w-screen h-screen max-h-screen overflow-hidden bg-black text-white select-none">
      {/* Background Space Photography (Earth Curvature + Astronaut) */}
      <img
        src={spaceBg}
        alt="Astronaut floating in deep space above Earth"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      {/* Subtle Dark Gradient Overlay for readability on right side */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-black/20 to-black/60 pointer-events-none" />

      {/* Main Content Container: Positioned on the Right Side */}
      <div className="relative z-10 w-full h-full flex flex-col justify-center items-center lg:items-end px-6 sm:px-12 lg:pr-24 xl:pr-40">
        <div className="max-w-md text-center lg:text-left">
          {/* "Oops!" */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-normal text-white tracking-wide">
            Oops!
          </h2>

          {/* "404" */}
          <h1 className="text-7xl sm:text-8xl lg:text-[140px] font-bold text-white tracking-tight leading-none my-2 sm:my-3">
            404
          </h1>

          {/* Subtitle with Dynamic Countdown */}
          <p className="text-sm sm:text-base text-gray-200 font-light leading-relaxed max-w-sm mx-auto lg:mx-0">
            Your page is currently under maintenance and will guide you back to the homepage after{' '}
            <span className="font-semibold text-white">{countdown}</span> seconds.
          </p>

          {/* "Back to home" Outline Pill Button */}
          <div className="mt-7 sm:mt-9">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault()
                navigate('/')
              }}
              className="inline-block rounded-full border border-white px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-medium tracking-wide text-white transition-all duration-200 hover:bg-white hover:text-black active:scale-95 shadow-lg"
            >
              Back to home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
