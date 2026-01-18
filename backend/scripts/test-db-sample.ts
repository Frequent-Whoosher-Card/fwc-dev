import db from "../src/config/db";

async function main() {
  // Get some members with cards
  const members = await db.member.findMany({
    take: 5,
    include: {
      cards: {
        include: {
          redeems: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  console.log("=== SAMPLE DATA DARI DATABASE ===\n");

  for (const m of members) {
    console.log("Member:", m.name);
    console.log("  NIK:", m.identityNumber);
    for (const c of m.cards) {
      console.log("  Card Serial:", c.serialNumber);
      console.log("  Card Created:", c.createdAt);
      for (const r of c.redeems) {
        console.log("  Redeem Shift Date:", r.shiftDate);
      }
    }
    console.log("---");
  }

  // Count totals
  const totalMembers = await db.member.count();
  const totalCards = await db.card.count();
  const totalRedeems = await db.redeem.count();

  console.log("\n=== TOTALS ===");
  console.log("Members:", totalMembers);
  console.log("Cards:", totalCards);
  console.log("Redeems:", totalRedeems);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
