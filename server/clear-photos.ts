
import { db } from "./db";
import { componentPhotos } from "@db/schema";

async function clearAllPhotos() {
  try {
    const deletedPhotos = await db.delete(componentPhotos).returning();
    console.log(`Cleared ${deletedPhotos.length} placeholder photos`);
    process.exit(0);
  } catch (error) {
    console.error("Error clearing photos:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  clearAllPhotos();
}
