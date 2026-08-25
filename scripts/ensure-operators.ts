import "dotenv/config";
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { DASHBOARD_OPERATORS } from "../src/server/auth/operators";

const prisma = new PrismaClient();

function passwordFor(email: string) {
  if (email === "nathysimelanei@gmail.com") return process.env.DASHBOARD_OPERATOR_NATHY_PASSWORD;
  if (email === "bhumbasimelane@gmail.com") return process.env.DASHBOARD_OPERATOR_BHUMBA_PASSWORD;
  return undefined;
}

async function upsertOperator(email: string, name: string, role: string, password: string) {
  const hashed = await hashPassword(password);
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true, twoFactor: true },
  });

  if (!existing) {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        emailVerified: true,
        role,
        twoFactorEnabled: true,
        accounts: {
          create: {
            accountId: email,
            providerId: "credential",
            password: hashed,
          },
        },
        twoFactor: {
          create: {
            secret: randomBytes(20).toString("hex"),
            backupCodes: "[]",
            verified: true,
          },
        },
      },
    });
    return user.id;
  }

  const credential = existing.accounts.find((account) => account.providerId === "credential");
  if (credential) {
    await prisma.account.update({
      where: { id: credential.id },
      data: { password: hashed, accountId: email },
    });
  } else {
    await prisma.account.create({
      data: {
        userId: existing.id,
        accountId: email,
        providerId: "credential",
        password: hashed,
      },
    });
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: { name, role, emailVerified: true, twoFactorEnabled: true },
  });

  if (!existing.twoFactor) {
    await prisma.twoFactor.create({
      data: {
        userId: existing.id,
        secret: randomBytes(20).toString("hex"),
        backupCodes: "[]",
        verified: true,
      },
    });
  }

  await prisma.session.deleteMany({ where: { userId: existing.id } });
  return existing.id;
}

async function main() {
  const missing = DASHBOARD_OPERATORS.filter((op) => !passwordFor(op.email));
  if (missing.length) {
    throw new Error(
      "Set DASHBOARD_OPERATOR_NATHY_PASSWORD and DASHBOARD_OPERATOR_BHUMBA_PASSWORD before creating operator accounts.",
    );
  }

  const demo = await prisma.user.findUnique({ where: { email: "demo@onyxwebsystems.com" } });
  if (demo) {
    await prisma.employee.updateMany({ where: { userId: demo.id }, data: { userId: null } });
    await prisma.session.deleteMany({ where: { userId: demo.id } });
    await prisma.twoFactor.deleteMany({ where: { userId: demo.id } });
    await prisma.account.deleteMany({ where: { userId: demo.id } });
    await prisma.user.delete({ where: { id: demo.id } });
    console.log("Removed demo@onyxwebsystems.com");
  }

  for (const op of DASHBOARD_OPERATORS) {
    await upsertOperator(op.email, op.name, op.role, passwordFor(op.email)!);
    console.log(`Operator ready: ${op.email}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
