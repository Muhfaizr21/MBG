import { useState } from 'react'
import { FAQS } from '../../data/mbgData'

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <section id="faq" aria-label="Tanya Jawab" className="border-t border-gray-100 bg-white py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <p className="font-serif text-sm italic text-gray-500">Tanya Jawab Seputar KawanGizi</p>
          <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-gray-900">
            Pertanyaan yang Sering <em className="font-serif italic font-normal text-gray-700">Diajukan</em>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-500">
            Jawaban transparan seputar cara kerja platform KawanGizi, keakuratan data nutrisi, dan keamanan makanan bergizi gratis.
          </p>
        </div>

        <div className="mt-12 divide-y divide-gray-200/80 border-y border-gray-200/80">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index
            return (
              <div key={index} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between text-left text-base sm:text-lg font-bold text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 text-sm font-semibold transition-transform">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-gray-500 pr-8">
                    {faq.a}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
