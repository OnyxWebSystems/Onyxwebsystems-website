import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "About" };

const OFFERINGS = [
  {
    title: "Websites",
    body: "High-end digital experiences designed to communicate a brand and convert visitors into customers.",
  },
  {
    title: "Applications",
    body: "Custom software built around the specific needs of a business.",
  },
  {
    title: "Business Operating Systems",
    body: "Connected modules that help businesses manage sales, finance, operations, customer experience, HR, and reporting.",
  },
  {
    title: "AI & Automation",
    body: "Intelligent workflows designed to reduce repetitive work, improve efficiency, and help teams focus on higher-value tasks.",
  },
  {
    title: "Custom Systems",
    body: "Technology designed from the ground up around the way a business actually operates.",
  },
];

const PRINCIPLES = [
  {
    title: "CREATE.",
    body: "We create digital experiences, applications, and systems that solve real business problems.",
  },
  {
    title: "CONNECT.",
    body: "We connect people, processes, data, and technology so the different parts of a business can work together.",
  },
  {
    title: "CONVERT.",
    body: "We turn technology into outcomes — complexity into efficiency, opportunities into customers, and systems into growth.",
  },
];

const QUESTIONS = [
  "How do leads enter?",
  "How are customers managed?",
  "Where is time being wasted?",
  "What tasks are repetitive?",
  "Where are teams losing information?",
  "What systems are disconnected?",
  "What could be automated?",
  "What could be improved?",
];

const PROCESS = [
  { n: "01", title: "Understand", body: "Learn the business and identify the problem." },
  { n: "02", title: "Map", body: "Understand the workflows, people, systems, and processes involved." },
  { n: "03", title: "Design", body: "Create the architecture and experience needed to solve the problem." },
  { n: "04", title: "Build", body: "Develop the technology, automation, and infrastructure." },
  { n: "05", title: "Connect", body: "Integrate the different systems so information flows seamlessly." },
  { n: "06", title: "Improve", body: "Continuously refine the system as the business evolves." },
];

const STANDARDS = [
  { title: "Simple", body: "Complex technology should feel simple." },
  { title: "Intelligent", body: "Systems should help businesses make better decisions." },
  { title: "Connected", body: "The tools a business uses should work together." },
  { title: "Scalable", body: "Technology should grow alongside the business." },
  { title: "Human", body: "Automation should empower people, not remove judgment where it matters." },
];

export default function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-black">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-center px-6 py-24">
          <p className="ox-reveal text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">About Onyx</p>
          <h1 className="ox-reveal ox-reveal-delay-1 mt-5 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl lg:text-[4.5rem] lg:leading-[1.05]">
            We&apos;re building more than websites.
          </h1>
          <p className="ox-reveal ox-reveal-delay-2 mt-6 max-w-2xl text-lg leading-relaxed sm:text-2xl">
            We&apos;re building the systems behind modern businesses.
          </p>
          <p className="ox-reveal ox-reveal-delay-3 mt-8 max-w-2xl text-base leading-relaxed text-[#5c5c5c]">
            Onyx Web Systems was founded on a simple belief: technology should make business better. Better
            connected. More efficient. More scalable.
          </p>
          <div className="ox-rule ox-reveal-delay-3 mt-16 h-px w-full max-w-xs bg-black" />
        </div>
      </section>

      <section className="border-b border-black">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">How it started</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">Two brothers. One vision.</h2>
          <div className="mt-14 grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <figure className="border border-black">
              <div className="relative aspect-[4/5] bg-black">
                <Image
                  src="/about/sihle-simelane.png"
                  alt="Sihle Nathi Simelane, founder of Onyx Web Systems"
                  fill
                  className="object-cover object-[50%_18%]"
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  priority
                />
              </div>
              <figcaption className="border-t border-black px-4 py-3">
                <p className="text-sm font-semibold">Sihle Nathi Simelane</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#5c5c5c]">Founder</p>
              </figcaption>
            </figure>
            <div className="space-y-5 text-base leading-relaxed text-[#5c5c5c]">
              <p>
                On November 16, 2025, <span className="text-black">Sihle Nathi Simelane</span> founded Onyx Web
                Systems while studying Computer Science at Emeris.
              </p>
              <p>
                With a passion for technology and a strong entrepreneurial mindset, Sihle saw an opportunity to help
                businesses use technology not just to create an online presence, but to improve the way they operate.
              </p>
              <p>The company began by building websites and digital experiences. Then the vision expanded.</p>
              <p>
                Businesses needed more than websites. They needed systems that could connect operations, automate
                repetitive work, improve customer experiences, and help them grow. That became the foundation of Onyx
                Web Systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">The next chapter</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">Building it together.</h2>
          <div className="mt-14 grid items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="order-2 space-y-5 text-base leading-relaxed text-[#5c5c5c] lg:order-1">
              <p>
                As the vision grew, <span className="text-black">Lihle Simelane</span> joined the company to help
                build and expand Onyx.
              </p>
              <p>
                With a background in Computer Engineering, a strong business mindset, and experience as a
                student-athlete in the United States, Lihle brought a different perspective to the company.
              </p>
              <p>
                While Sihle focused on building and developing the technology, Lihle became focused on growing the
                business — developing relationships, understanding client needs, and turning opportunities into
                partnerships.
              </p>
              <blockquote className="border-l border-black pl-5 text-lg font-semibold leading-snug text-black">
                Don&apos;t just build what a business needs today. Build what it needs to become tomorrow.
              </blockquote>
            </div>
            <figure className="order-1 border border-black lg:order-2">
              <div className="relative aspect-[4/5] bg-black">
                <Image
                  src="/about/lihle-simelane.png"
                  alt="Lihle Simelane, co-builder of Onyx Web Systems"
                  fill
                  className="object-cover object-[50%_20%]"
                  sizes="(min-width: 1024px) 40vw, 100vw"
                />
              </div>
              <figcaption className="border-t border-black px-4 py-3">
                <p className="text-sm font-semibold">Lihle Simelane</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#5c5c5c]">Growth &amp; Partnerships</p>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="border-b border-black">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">From websites to business systems</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            What started with websites has become a technology company.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#5c5c5c]">
            We don&apos;t believe businesses need more tools. They need better systems.
          </p>
          <div className="mt-14 grid gap-px bg-black sm:grid-cols-2 lg:grid-cols-3">
            {OFFERINGS.map((item) => (
              <article key={item.title} className="bg-white p-6">
                <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#5c5c5c]">{item.body}</p>
              </article>
            ))}
            <article className="flex flex-col justify-between bg-black p-6 text-white">
              <p className="text-sm uppercase tracking-[0.18em] text-[#a3a3a0]">The point</p>
              <div className="mt-8">
                <p className="text-2xl font-semibold tracking-tight">Businesses don&apos;t need more tools.</p>
                <p className="mt-3 text-sm leading-relaxed text-[#a3a3a0]">They need better systems.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-black bg-black text-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-sm uppercase tracking-[0.22em] text-[#a3a3a0]">Our philosophy</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">CREATE. CONNECT. CONVERT.</h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#a3a3a0]">
            Three words define how we approach technology. This isn&apos;t just our tagline. It&apos;s how we think.
          </p>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {PRINCIPLES.map((item) => (
              <article key={item.title} className="border-t border-white/20 pt-6">
                <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#a3a3a0]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-black">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">How we think</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            We don&apos;t start with technology.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed">We start with the business.</p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#5c5c5c]">
            Before building anything, we want to understand how the business actually works. Then we design
            technology around those answers.
          </p>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {QUESTIONS.map((question) => (
              <li key={question} className="border border-black/15 px-4 py-3 text-sm text-[#5c5c5c]">
                {question}
              </li>
            ))}
          </ul>
          <ol className="mt-16">
            {PROCESS.map((step) => (
              <li key={step.n} className="border-t border-black/15">
                <div className="grid gap-3 py-7 sm:grid-cols-[88px_180px_1fr] sm:items-baseline sm:gap-8">
                  <p className="text-sm uppercase tracking-[0.18em] text-[#5c5c5c]">{step.n}</p>
                  <h3 className="text-xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[#5c5c5c] sm:text-base">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-black">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">Our belief</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            Technology should work for you.
          </h2>
          <div className="mt-8 max-w-2xl space-y-4 text-base leading-relaxed text-[#5c5c5c]">
            <p>The best technology shouldn&apos;t make a business more complicated. It should make things simpler.</p>
            <p>
              It should remove repetitive work, connect disconnected systems, give people better information, create
              better customer experiences, and help a business scale without adding more complexity.
            </p>
            <p className="text-black">That&apos;s the type of technology we want to build.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-black">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">The Onyx standard</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">How we measure the work.</h2>
          <div className="mt-14 grid gap-px bg-black sm:grid-cols-2 lg:grid-cols-5">
            {STANDARDS.map((item) => (
              <article key={item.title} className="bg-white p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em]">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#5c5c5c]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-black">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">Where we&apos;re going</p>
          <h2 className="mt-4 max-w-4xl text-3xl font-bold tracking-tight sm:text-5xl">
            Still at the beginning. Already bigger than websites.
          </h2>
          <div className="mt-8 max-w-2xl space-y-4 text-base leading-relaxed text-[#5c5c5c]">
            <p>
              We are building toward a future where businesses operate through intelligent, connected systems
              designed around the way they actually work.
            </p>
            <p>
              A future where businesses don&apos;t rely on dozens of disconnected tools and endless manual processes.
              A future where technology becomes the infrastructure behind the business.
            </p>
            <p className="text-black">That&apos;s the future we&apos;re building at Onyx. One system at a time.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-black">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">CREATE. CONNECT. CONVERT.</p>
          <h2 className="mt-4 max-w-4xl text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Let&apos;s build what&apos;s next.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#5c5c5c]">
            Your business has a way of working. We&apos;ll build the technology around it.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/book" className="ox-btn-solid px-6 py-3 text-sm font-medium">
              Work With Us
            </Link>
            <Link href="/services" className="ox-btn-outline px-6 py-3 text-sm font-medium">
              Explore Our Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
