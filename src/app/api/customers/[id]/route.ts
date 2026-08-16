import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCustomerProfile } from "@/server/domain/customers";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const customer = await getCustomerProfile(id);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ customer });
}
