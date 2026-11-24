import Link from "next/link";
import { getTrendingStyles } from "@/lib/trendingStyles";

export default async function TrendingStyles() {
  const styles = await getTrendingStyles();

  return (
    <section
      id="trending-styles"
      aria-labelledby="trending-styles-heading"
      className="border-t border-fuchsia-500/15 bg-[#140724] px-5 py-14 text-white"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-400">
              Google Images discovery
            </p>
            <h2 id="trending-styles-heading" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              🔥 Trending Black Hairstyles This Week
            </h2>
            <p className="mt-2 text-sm text-purple-100/70">
              Ranked automatically from image frequency and search position.
            </p>
          </div>
          <Link href="/book" className="text-sm font-medium text-fuchsia-300 transition hover:text-fuchsia-200">
            Book Now →
          </Link>
        </div>

        {styles.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-purple-100/70">
            This week&apos;s trends will appear after the scheduled discovery run.
          </p>
        ) : (
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {styles.map((style, index) => (
              <li key={style.id}>
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-fuchsia-500/20 bg-[#1E0B36]">
                  <div className="relative h-60 bg-[#2A104A]">
                    {style.imageUrl ? (
                      // Image providers vary by search result, so native lazy loading supports the complete SerpAPI result set.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={style.imageUrl}
                        alt={style.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-purple-100/50">Image unavailable</div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1 text-sm font-black text-fuchsia-300">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-lg font-bold leading-snug">{style.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-purple-200">Trend score {style.trendScore}</p>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                      {style.sourceUrl && (
                        <a
                          href={style.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-purple-200 transition hover:text-white"
                        >
                          View source ↗
                        </a>
                      )}
                      <Link
                        href={`/book?service=${encodeURIComponent(style.name)}`}
                        className="ml-auto rounded-full bg-fuchsia-500 px-3 py-2 text-xs font-semibold text-black transition hover:bg-fuchsia-400"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
