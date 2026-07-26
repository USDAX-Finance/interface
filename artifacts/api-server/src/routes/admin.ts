import { Router, type IRouter } from "express";
import { db, positionsTable, activityEventsTable, stakingPositionsTable } from "@workspace/db";

const router: IRouter = Router();

/**
 * POST /api/admin/cleanup
 * One-time endpoint to purge all seed / dummy data from the database.
 * Protected by SESSION_SECRET via the X-Admin-Token header.
 * Safe to leave deployed — does nothing without the correct token.
 */
router.post("/admin/cleanup", async (req, res): Promise<void> => {
  const token = req.headers["x-admin-token"];
  const secret = process.env.SESSION_SECRET;

  if (!secret || token !== secret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [positions, events, staking] = await Promise.all([
    db.delete(positionsTable).returning({ id: positionsTable.id }),
    db.delete(activityEventsTable).returning({ id: activityEventsTable.id }),
    db.delete(stakingPositionsTable).returning({ id: stakingPositionsTable.id }),
  ]);

  res.json({
    deleted: {
      positions:        positions.length,
      activityEvents:   events.length,
      stakingPositions: staking.length,
    },
  });
});

export default router;
