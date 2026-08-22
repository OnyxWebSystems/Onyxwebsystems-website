import { BookConsultationForm } from "./book-form";

export const metadata = { title: "Book a Consultation" };

export default function BookPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[#5c5c5c]">Consultation</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Book a conversation</h1>
      <p className="mt-4 text-sm text-[#5c5c5c]">
        Tell us what you need. We will email a confirmation, then a link to choose a 30-minute time from our
        live calendar.
      </p>
      <div className="mt-10">
        <BookConsultationForm />
      </div>
    </div>
  );
}
