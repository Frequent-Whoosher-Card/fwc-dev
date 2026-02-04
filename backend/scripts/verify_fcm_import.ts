
import { config } from 'dotenv';
config(); // Load .env manually just to be safe, though bun usually handles it.

import db from "../src/config/db";

async function check() {
  try {
    console.log("Connecting to DB...");
    // Test connection by counting
    const count = await db.fcmToken.count();
    console.log(`Found ${count} tokens.`);

    const tokens = await db.fcmToken.findMany({
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    console.log("----- DATA FCM TOKENS DI DATABASE -----");
    if (tokens.length === 0) {
      console.log("(KOSONG) Belum ada token yang masuk.");
    } else {
      tokens.forEach((t, i) => {
        console.log(`${i+1}. Token: ${t.token.substring(0, 10)}... | User: ${t.user?.username || 'Guest'} | Device: ${t.deviceInfo}`);
      });
      console.log("---------------------------------------");
    }
  } catch (e) {
    console.error("Error verifying DB:", e);
  } finally {
   // Don't disconnect if using the shared instance/pool maybe? 
   // But script is ending anyway.
  }
}

check();
