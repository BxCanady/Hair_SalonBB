import Image from "next/image";
import Link from "next/link";
import { getTrendingPinterestStyles } from "@/lib/pinterestTrends";

export default async function TrendingPinterestStyles() {
  const styles = await getTrendingPinterestStyles();

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
              Pinterest Inspiration
            </p>
            <h2
              id="trending-styles-heading"
              className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Trending styles.
            </h2>
          </div>

          <Link
            href="/book"
            className="text-sm font-medium text-fuchsia-300 transition hover:text-fuchsia-200"
          >
            Book Now →
          </Link>
        </div>

        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 md:grid md:grid-cols-3">
          {styles.map((item) => (
            <article
              key={item.id}
              className="flex min-w-[280px] snap-start flex-col justify-between overflow-hidden rounded-2xl border border-fuchsia-500/20 bg-[#1E0B36] sm:min-w-[320px] md:min-w-0"
            >
              <div>
                <div className="relative h-56 w-full bg-[#2A104A]">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 320px, 33vw"
                  />
                </div>

                <div className="p-5">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-fuchsia-300">
                    {item.service}
                  </p>
                  <h3 className="line-clamp-2 text-lg font-bold leading-snug text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-purple-100/80">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-white/10 px-5 pb-5 pt-3">
                <a
                  href={item.pinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-purple-200 transition hover:text-white"
                >
                  Pinterest ↗
                </a>

                <Link
                  href={`/book?service=${encodeURIComponent(item.service)}`}
                  className="rounded-full bg-fuchsia-500 px-3.5 py-2 text-xs font-semibold text-black transition hover:bg-fuchsia-400"
                >
                  Book this look
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
