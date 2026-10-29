import HomeHero from "./HomeHero";
import HomeVideo from "./HomeVideo";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-3 py-4">
        <HomeHero />
        <HomeVideo />
        <a
          href="/book"
          className="rounded-lg bg-primary px-4 py-3 text-center font-semibold text-black hover:bg-primary-dark"
        >
          Book an appointment
        </a>
      </main>
    </div>
  );
}
