import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Home() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getArticles({ featured: '1' })
      .then(setArticles)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-[40px] font-semibold tracking-tight text-neutral-900 md:text-[56px]">
            Stories, ideas, and<br />perspectives
          </h1>
          <p className="mt-5 text-[18px] leading-relaxed text-neutral-500">
            A space for thoughtful writing on technology, design, and the future of the web.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to="/episodes"
              className="rounded-full bg-neutral-900 px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Start listening
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-100 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-[13px] font-medium uppercase tracking-wider text-neutral-400">Featured</h2>
            <Link to="/episodes" className="text-[13px] text-neutral-500 hover:text-neutral-900">View all</Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[14px] text-neutral-400">Loading...</div>
          ) : articles.length === 0 ? (
            <div className="py-12 text-center text-[14px] text-neutral-400">No episodes yet.</div>
          ) : (
            <div className="space-y-8">
              {articles.slice(0, 3).map((a, i) => (
                <Link
                  key={a.id}
                  to={`/episodes/${a.id}`}
                  className={`group block ${i === 0 ? '' : 'border-t border-neutral-100 pt-8'}`}
                >
                  <div className="flex items-center gap-2 text-[13px] text-neutral-400">
                    <span>{a.category || 'General'}</span>
                    <span>·</span>
                    <span>{a.reading_time} min read</span>
                  </div>
                  <h3 className={`mt-2 font-semibold text-neutral-900 group-hover:underline ${
                    i === 0 ? 'text-[24px]' : 'text-[20px]'
                  }`}>
                    {a.title}
                  </h3>
                  {a.excerpt && (
                    <p className="mt-2 text-[15px] leading-relaxed text-neutral-500 line-clamp-2">
                      {a.excerpt}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-[13px] text-neutral-400">
                    <span>{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-neutral-100 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[24px] font-semibold tracking-tight text-neutral-900">Stay updated</h2>
          <p className="mt-2 text-[15px] text-neutral-500">Get the latest episodes delivered to your inbox.</p>
          <div className="mt-6 flex max-w-md mx-auto gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-[14px] text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
            />
            <button className="rounded-full bg-neutral-900 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-100 py-8">
        <div className="mx-auto max-w-2xl text-center text-[13px] text-neutral-400">
          &copy; {new Date().getFullYear()} Prodium. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
