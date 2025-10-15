import { internalMutation } from "../_generated/server";

/**
 * Migration: Add futurePlans field to existing dailyInput records
 * Run this once to backfill the field for old records
 */
export const addFuturePlansToExistingRecords = internalMutation({
  handler: async (ctx) => {
    const allInputs = await ctx.db.query("dailyInput").collect();

    let updatedCount = 0;

    for (const input of allInputs) {
      // Check if futurePlans is missing
      if (!('futurePlans' in input)) {
        await ctx.db.patch(input._id, {
          futurePlans: [], // Add empty array as default
        });
        updatedCount++;
      }
    }

    console.log(`✅ Migration complete: Updated ${updatedCount} records`);
    return { success: true, updatedCount };
  },
});
