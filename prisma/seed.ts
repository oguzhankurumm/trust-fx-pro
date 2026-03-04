import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import path from "node:path";
import { config } from "dotenv";

// Load env for seed script
config({ path: path.resolve(process.cwd(), ".env") });
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Admin User ────────────────────────────────────────────────────────────
  const adminEmail = "admin@trustfx.pro";
  const adminPassword = "Admin123!";
  const adminHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      name: "TrustFX Admin",
      role: "ADMIN",
      status: "ACTIVE",
      profile: { create: { name: "TrustFX Admin" } },
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ─── Regular User ──────────────────────────────────────────────────────────
  const userEmail = "kullanici@trustfx.pro";
  const userPassword = "User123!";
  const userHash = await bcrypt.hash(userPassword, 12);

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      email: userEmail,
      passwordHash: userHash,
      name: "Demo Kullanıcı",
      role: "USER",
      status: "ACTIVE",
      profile: { create: { name: "Demo Kullanıcı" } },
    },
  });
  console.log(`✅ User: ${user.email}`);

  // ─── Sample Ledger Entries for regular user ────────────────────────────────
  // Check if user already has entries to avoid duplicates
  const existingEntries = await prisma.ledgerEntry.count({ where: { userId: user.id } });
  if (existingEntries === 0) {
    await prisma.ledgerEntry.createMany({
      data: [
        // Initial TRY deposit — approved by admin via adjustment
        {
          userId: user.id,
          type: "ADJUSTMENT",
          amount: 10000.00,
          currency: "TRY",
          status: "APPROVED",
          metadata: { adminId: admin.id, reason: "Hoşgeldin bonusu", adjustType: "ADD" },
        },
        // User deposit — approved
        {
          userId: user.id,
          type: "DEPOSIT",
          amount: 5000.00,
          currency: "TRY",
          status: "APPROVED",
          metadata: { note: "Banka havalesi" },
        },
        // User withdrawal — approved
        {
          userId: user.id,
          type: "WITHDRAWAL",
          amount: -2000.00,
          currency: "TRY",
          status: "APPROVED",
          metadata: { note: "IBAN çekimi" },
        },
        // Pending deposit
        {
          userId: user.id,
          type: "DEPOSIT",
          amount: 1500.00,
          currency: "TRY",
          status: "PENDING",
          metadata: { note: "EFT onay bekleniyor" },
        },
        // USDT deposit — approved
        {
          userId: user.id,
          type: "ADJUSTMENT",
          amount: 500.00,
          currency: "USDT",
          status: "APPROVED",
          metadata: { adminId: admin.id, reason: "USDT test bakiyesi", adjustType: "ADD" },
        },
        // Rejected withdrawal
        {
          userId: user.id,
          type: "WITHDRAWAL",
          amount: -3000.00,
          currency: "TRY",
          status: "REJECTED",
          metadata: { adminReason: "Yetersiz belge" },
        },
      ],
    });
    console.log("✅ Sample ledger entries created for demo user.");
  }

  // ─── Sample Admin Audit ────────────────────────────────────────────────────
  const existingAudits = await prisma.adminAudit.count({ where: { adminId: admin.id } });
  if (existingAudits === 0) {
    await prisma.adminAudit.create({
      data: {
        adminId: admin.id,
        actionType: "BALANCE_ADJUST",
        targetUserId: user.id,
        payload: {
          amount: "10000",
          currency: "TRY",
          type: "ADD",
          reason: "Hoşgeldin bonusu",
          targetEmail: user.email,
        },
      },
    });
    console.log("✅ Sample admin audit created.");
  }

  console.log("\n🎉 Seed complete!");
  console.log("---");
  console.log(`Admin  → ${adminEmail} / ${adminPassword}`);
  console.log(`User   → ${userEmail} / ${userPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
