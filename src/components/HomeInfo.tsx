import Link from "next/link";
import { Clock3, MapPin, Scissors, Sparkles } from "lucide-react";

const preparation = [
  {
    title: "Hair prep",
    text: "Arrive with clean, fully dry, detangled, product-free hair unless a wash and blow-dry add-on has been arranged.",
  },
  {
    title: "Braiding hair",
    text: "Confirm whether hair is included and which brand, color, and length to bring before your appointment.",
  },
  {
    title: "Deposits & timing",
    text: "Review the deposit, cancellation, and late-arrival terms sent with your appointment confirmation. Longer services may require additional notice.",
  },
  {
    title: "Micro loc consultation",
    text: "For a Micro Loc install, message the salon before your full appointment to confirm whether a consultation is needed for your hair and desired size.",
  },
];

export default function HomeInfo() {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2" aria-labelledby="before-you-book">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Plan a smooth appointment</p>
          <h2 id="before-you-book" className="mt-2 text-2xl font-bold text-white">Before you book</h2>
          <p className="mt-2 text-sm leading-6 text-white/65">
            A little prep protects your time and helps your finished style look its best.
          </p>
          <div className="mt-5 space-y-2">
            {preparation.map((item, index) => (
              <details key={item.title} className="group rounded-xl border border-white/10 bg-white/[0.04]" open={index === 0}>
                <summary className="cursor-pointer list-none px-4 py-3 pr-10 text-sm font-semibold text-white marker:content-none">
                  <span>{item.title}</span>
                  <span className="float-right text-primary transition group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="px-4 pb-4 text-sm leading-6 text-white/65">{item.text}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Meet your stylist</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Intentional care, from roots to finish.</h2>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Beast at Braid specializes in custom braided looks, Micro Loc installations, and secure styles for
            shorter hair. Every appointment is shaped around your hair, your comfort, and the look you want to wear.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            <li className="flex gap-3 rounded-xl bg-white/[0.05] p-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div><p className="font-semibold text-white">Custom finish</p><p className="text-xs leading-5 text-white/55">Designed around your inspiration.</p></div>
            </li>
            <li className="flex gap-3 rounded-xl bg-white/[0.05] p-3">
              <Scissors className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div><p className="font-semibold text-white">Short-hair care</p><p className="text-xs leading-5 text-white/55">Secure grip without sacrificing style.</p></div>
            </li>
          </ul>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-sm">
            <p className="flex items-center gap-2 text-white/70"><MapPin className="h-4 w-4 text-primary" aria-hidden /> Greensboro, NC</p>
            <p className="flex items-center gap-2 text-white/70"><Clock3 className="h-4 w-4 text-primary" aria-hidden /> By appointment</p>
          </div>
          <Link href="/book" className="mt-5 inline-flex font-semibold text-primary hover:text-white">
            See live availability <span aria-hidden className="ml-2">→</span>
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8" aria-labelledby="salon-promises">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">The salon standard</p>
          <h2 id="salon-promises" className="mt-2 text-2xl font-bold text-white">Details you can see. Care you can feel.</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Review recent work in the lookbook and use the online calendar to choose the service that fits your hair goals.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["Clean parting", "Precision from the first section to the final finish."],
            ["Comfort-minded installs", "A thoughtful approach to tension, grip, and scalp comfort."],
            ["Live booking", "Compare service pricing and duration before reserving."],
          ].map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-black/45 p-4">
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
