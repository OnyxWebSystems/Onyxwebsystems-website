import { BookConsultationForm } from "./book-form";

export const metadata = { title: "Book a Consultation" };

export default function BookPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[#5c5c5c]">Consultation</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Book a conversation</h1>
      <p className="mt-4 text-sm text-[#5c5c5c]">
        Choose a date and time that is open on our calendar, then send the request. You will receive one
        confirmation email with a calendar invitation.
      </p>
      <div className="mt-10">
        <BookConsultationForm />
      </div>
    </div>
  );
}
