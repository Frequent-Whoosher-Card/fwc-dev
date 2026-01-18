import db from "../src/config/db";

async function createTestRedeems() {
  // Get cards with their members (only cards that have members)
  const cards = await db.card.findMany({
    where: {
      memberId: { not: null }
    },
    take: 10,
    include: {
      member: true,
    },
  });

  console.log(`Found ${cards.length} cards with members`);

  // Get a station and operator
  const station = await db.station.findFirst();
  const operator = await db.user.findFirst();

  console.log("=== Checking prerequisites ===\n");
  console.log("Station:", station?.id, station?.stationName);
  console.log("Operator:", operator?.id, operator?.fullName);
  console.log("Cards with members:", cards.length);

  if (!station || !operator) {
    console.error(
      "\n❌ No station or operator found. Please create them first."
    );
    return;
  }

  if (cards.length === 0) {
    console.error("\n❌ No cards with members found.");
    return;
  }

  console.log("\n=== Creating Test Redeems ===\n");

  let created = 0;

  for (const card of cards) {
    if (!card.member) continue;

    // Create redeem with shift_date = 2026-01-14 (matching test Excel)
    const transactionNumber = `TRX-TEST-${Date.now()}-${created}`;

    try {
      await db.redeem.create({
        data: {
          cardId: card.id,
          transactionNumber,
          operatorId: operator.id,
          stationId: station.id,
          shiftDate: new Date("2026-01-14"), // Same as test Excel ticketing date
          status: "Success",
          prev_quota: 10,
          quota_used: 1,
          remain_quota: 9,
          redeem_type: "SINGLE",
          createdBy: operator.id,
        },
      });

      console.log(
        `✅ Created redeem for card ${card.serialNumber} (Member: ${card.member.name}, NIK: ${card.member.identityNumber})`
      );
      created++;
    } catch (error: any) {
      console.log(`❌ Failed for card ${card.serialNumber}: ${error.message}`);
    }
  }

  console.log(`\n=== Done! Created ${created} redeems ===`);

  // Verify count
  const totalRedeems = await db.redeem.count();
  console.log(`Total redeems in database: ${totalRedeems}`);
}

createTestRedeems()
  .catch(console.error)
  .finally(() => db.$disconnect());
