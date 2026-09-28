import { ArrowIcon } from './Icons'

export function CtaButton({ href, children, solid = false, className = '' }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-widest transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 ${
        solid
          ? 'bg-gray-900 text-white hover:bg-gray-800'
          : 'border border-gray-300 bg-white/90 text-gray-900 shadow-sm hover:bg-gray-900 hover:text-white hover:border-gray-900'
      } ${className}`}
    >
      {children}
      <ArrowIcon />
    </a>
  )
}
