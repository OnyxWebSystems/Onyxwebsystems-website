type DayHours = { open: string; close: string } | null;

export function isBusinessOpen(
  businessHours: Record<string, DayHours>,
  at: Date = new Date(),
): boolean {
  // America/Phoenix UTC-7
  const utc = at.getTime() + at.getTimezoneOffset() * 60_000;
  const phoenix = new Date(utc - 7 * 60 * 60_000);
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const day = dayNames[phoenix.getUTCDay()];
  const hours = businessHours[day];
  if (!hours) return false;

  const [oh, om] = hours.open.split(":").map(Number);
  const [ch, cm] = hours.close.split(":").map(Number);
  const mins = phoenix.getUTCHours() * 60 + phoenix.getUTCMinutes();
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;
  return mins >= openMins && mins < closeMins;
}
