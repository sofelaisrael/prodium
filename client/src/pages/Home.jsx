import { Link } from 'react-router-dom'
import lineIcon from '../assets/line.svg'
import banner from '../assets/banner.png'

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-5 md:mx-20 flex flex-1 flex-col rounded-2xl border border-black p-2">
        <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-xl">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${banner})` }}
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative mx-auto w-full px-4 md:text-center">
            <h1 className="font-bebas text-[40px] uppercase leading-none tracking-[0.04em] text-white md:text-[64px] lg:text-[128px]">
              Hi there! I'm Sofela
            </h1>
            <p className="font-novamono mt-6 w-full text-[13px] leading-relaxed text-white/80 md:mx-auto md:w-1/2 md:text-[16px]">
              This where i document my journey into Filmmaking, visual storytelling and the craft of turning ideas into stories. I started this as a way to hold myself accountable to the process. If you're here, you're probably figuring something out too. Welcome
            </p>
            <div className="mt-8">
              <Link
                to="/episodes"
                className="inline-flex items-center gap-2 bg-white px-10 py-3 text-[15px] font-medium text-black"
              >
                Browse Episodes
                <img src={lineIcon} alt="" className="h-2 w-auto" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <footer className="font-novamono mx-5 md:mx-20 flex items-center justify-center gap-6 py-5 md:py-10 text-[13px] text-neutral-400">
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900">Instagram</a>
        <a href="mailto:hello@sofela.com" className="hover:text-neutral-900">Email</a>
        <a href="https://vimeo.com" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900">Vimeo</a>
      </footer>
    </div>
  )
}
