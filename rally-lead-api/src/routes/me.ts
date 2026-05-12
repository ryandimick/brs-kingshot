import { Router } from "express";
import { requireSession, getUserId } from "../middleware/auth.js";

export const meRouter = Router();

meRouter.get("/", requireSession, (req, res) => {
  res.json({ userId: getUserId(req) });
});
