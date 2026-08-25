export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c5c5c]">Onyx Web Systems</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Terms of use</h1>
      <p className="mt-2 text-sm text-[#5c5c5c]">Last updated 25 August 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-[#5c5c5c]">
        <section>
          <h2 className="text-base font-semibold text-black">The website</h2>
          <p className="mt-2">
            This site describes Onyx Web Systems and lets visitors book a consultation. Formal project terms are
            issued with each proposal. Using the site or booking a meeting does not create a delivery contract.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-black">Bookings</h2>
          <p className="mt-2">
            Consultation slots are offered in South Africa Standard Time. You can reschedule from the link in your
            confirmation email, except on the day of the meeting. We may cancel or move a booking if we cannot keep
            the time, and we will contact you if that happens.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-black">Google Calendar connection</h2>
          <p className="mt-2">
            The dashboard Google Calendar connection is for the Onyx operator account only. It is used to record
            booked consultations and to avoid double-booking. It is not a public sign-in for clients.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-black">Contact</h2>
          <p className="mt-2">
            Questions:{" "}
            <a className="underline" href="mailto:onyxwebsystems@gmail.com">
              onyxwebsystems@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
