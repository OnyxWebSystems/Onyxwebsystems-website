"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

export function RoiCalculator() {
  const [salary, setSalary] = useState(37230);
  const [benefitsPct, setBenefitsPct] = useState(25);
  const [hoursPerWeek, setHoursPerWeek] = useState(40);
  const [callsPerDay, setCallsPerDay] = useState(60);
  const [leadsPerMonth, setLeadsPerMonth] = useState(80);
  const [avgCustomerValue, setAvgCustomerValue] = useState(700);
  const [missedCallPct, setMissedCallPct] = useState(30);
  const [conversionRate, setConversionRate] = useState(40);
  const [recoveryRate, setRecoveryRate] = useState(35);

  const calc = useMemo(() => {
    const annualLabour = salary * (1 + benefitsPct / 100);
    const monthlyLabour = annualLabour / 12;
    const workingDays = 22;
    const missedCallsPerMonth = callsPerDay * workingDays * (missedCallPct / 100);
    const recoveredLeads = missedCallsPerMonth * (recoveryRate / 100);
    const recoveredValue = recoveredLeads * (conversionRate / 100) * avgCustomerValue;
    const capacityHours = (callsPerDay * workingDays * 8) / 60; // 8 min/call estimate
    const estimatedAnnualValue = recoveredValue * 12 + annualLabour * 0.45;
    const roi = annualLabour > 0 ? ((estimatedAnnualValue - annualLabour * 0.2) / (annualLabour * 0.2)) * 100 : 0;

    return {
      annualLabour,
      monthlyLabour,
      missedCallsPerMonth,
      recoveredLeads,
      recoveredValue,
      capacityHours,
      estimatedAnnualValue,
      roi,
      leadsPerMonth,
      hoursPerWeek,
    };
  }, [
    salary,
    benefitsPct,
    callsPerDay,
    avgCustomerValue,
    missedCallPct,
    conversionRate,
    recoveryRate,
    leadsPerMonth,
    hoursPerWeek,
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="cx-card space-y-3 p-5">
        <div className="cx-label">Inputs</div>
        <Field label="Employee annual salary ($)" value={salary} onChange={setSalary} />
        <Field label="Benefits (%)" value={benefitsPct} onChange={setBenefitsPct} />
        <Field label="Working hours / week" value={hoursPerWeek} onChange={setHoursPerWeek} />
        <Field label="Calls per day" value={callsPerDay} onChange={setCallsPerDay} />
        <Field label="Leads per month" value={leadsPerMonth} onChange={setLeadsPerMonth} />
        <Field label="Average customer value ($)" value={avgCustomerValue} onChange={setAvgCustomerValue} />
        <Field label="Estimated missed calls (%)" value={missedCallPct} onChange={setMissedCallPct} />
        <Field label="Conversion rate (%)" value={conversionRate} onChange={setConversionRate} />
        <Field label="Missed-call recovery rate (%)" value={recoveryRate} onChange={setRecoveryRate} />
      </div>
      <div className="cx-card space-y-4 p-5">
        <div className="cx-label">Estimated outcomes</div>
        <Result label="Estimated annual labour cost" value={formatCurrency(calc.annualLabour * 100)} />
        <Result label="Estimated monthly labour cost" value={formatCurrency(calc.monthlyLabour * 100)} />
        <Result label="Estimated recovered capacity (hrs/mo)" value={calc.capacityHours.toFixed(1)} />
        <Result label="Estimated missed calls / month" value={calc.missedCallsPerMonth.toFixed(0)} />
        <Result label="Estimated value of recovered leads / month" value={formatCurrency(calc.recoveredValue * 100)} />
        <Result label="Estimated annual value" value={formatCurrency(calc.estimatedAnnualValue * 100)} />
        <Result label="Estimated ROI" value={`${calc.roi.toFixed(0)}%`} />
        <p className="rounded-lg border border-[var(--line)] bg-[var(--warning-soft)] px-3 py-2 text-xs text-[var(--warning)]">
          All calculations are estimates for demonstration only. They are not a guarantee of savings or revenue.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-[var(--ink-muted)]">{label}</span>
      <input
        type="number"
        className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-2 text-sm last:border-0">
      <span className="text-[var(--ink-muted)]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
