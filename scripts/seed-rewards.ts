import { db, rewardsTable } from "../lib/db/src/index.js";

async function seed() {
  console.log("Seeding rewards...");
  
  const rewards = [
    {
      name: "Fresh Coffee",
      description: "A warm cup of coffee from a local cafe.",
      pointsCost: 200,
      available: true,
    },
    {
      name: "Eco Tote Bag",
      description: "Reusable tote bag for your grocery shopping.",
      pointsCost: 500,
      available: true,
    },
    {
      name: "Plant a Tree",
      description: "We will plant a tree in your name.",
      pointsCost: 1000,
      available: true,
    },
  ];

  for (const reward of rewards) {
    await db.insert(rewardsTable).values(reward).onConflictDoNothing();
  }

  console.log("Rewards seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Failed to seed rewards:", err);
  process.exit(1);
});
