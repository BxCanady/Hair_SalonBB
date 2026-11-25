import Link from "next/link";
import { flattenImageCandidateUrls } from "@/lib/imageCandidates";
import { getTrendingStyles } from "@/lib/trendingStyles";
import FallbackImage from "./FallbackImage";

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
          <p className="text-sm font-medium text-fuchsia-300">Choose a look and ask the stylist →</p>
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
                    <FallbackImage
                      src={style.imageUrl}
                      title={style.name}
                      originalThumbnailUrl={style.thumbnailUrl}
                      alternativeUrls={flattenImageCandidateUrls(style.imageCandidates)}
                      alt={style.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
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
                        href={`/inquire?style=${encodeURIComponent(style.name)}&source=${encodeURIComponent(style.sourceUrl ?? "")}`}
                        className="ml-auto rounded-full bg-fuchsia-500 px-3 py-2 text-xs font-semibold text-black transition hover:bg-fuchsia-400"
                      >
                        Inquire
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
