export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c5c5c]">Onyx Web Systems</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Privacy policy</h1>
      <p className="mt-2 text-sm text-[#5c5c5c]">Last updated 25 August 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-[#5c5c5c]">
        <section>
          <h2 className="text-base font-semibold text-black">Who we are</h2>
          <p className="mt-2">
            Onyx Web Systems operates{" "}
            <a className="underline" href="https://onyxwebsystems.co.za">
              onyxwebsystems.co.za
            </a>{" "}
            and the booking dashboard at{" "}
            <a className="underline" href="https://dashboard.onyxwebsystems.co.za">
              dashboard.onyxwebsystems.co.za
            </a>
            . Contact:{" "}
            <a className="underline" href="mailto:onyxwebsystems@gmail.com">
              onyxwebsystems@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-black">What we collect</h2>
          <p className="mt-2">When you book a consultation or contact us, we collect:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Name, email address, phone number, and company name</li>
            <li>The service you are interested in and any notes you send</li>
            <li>The date and time of your booked meeting</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-black">Google Calendar</h2>
          <p className="mt-2">
            The Onyx operator account may connect Google Calendar so booked consultations can be written onto our
            calendar and so we can check when we are already busy. When connected, we request calendar access to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Create an “Onyx Web Systems” calendar if it does not already exist</li>
            <li>Create events for confirmed bookings, including the visitor’s name and email as an attendee</li>
            <li>Read busy times so we do not offer a slot that is already taken</li>
          </ul>
          <p className="mt-2">
            We do not sell calendar data. We do not use Google Calendar access to read unrelated personal events for
            marketing. Access can be revoked at any time from the Google account’s third-party connections page.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-black">How we use information</h2>
          <p className="mt-2">
            We use contact and booking details to confirm meetings, send reminders, follow up on enquiries, and
            operate the Onyx Web Systems website and dashboard. We use email delivery (Resend) to send those
            messages.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-black">Retention and requests</h2>
          <p className="mt-2">
            Booking records are kept for as long as needed to run the business relationship. Write to{" "}
            <a className="underline" href="mailto:onyxwebsystems@gmail.com">
              onyxwebsystems@gmail.com
            </a>{" "}
            to ask for a copy of your details or to ask us to delete them.
          </p>
        </section>
      </div>
    </div>
  );
}
