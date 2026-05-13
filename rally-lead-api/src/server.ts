import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { healthRouter } from "./routes/health.js";
import { meRouter } from "./routes/me.js";
import { profilesRouter } from "./routes/profiles.js";
import { optimizeRouter } from "./routes/optimize.js";

const app = express();

app.use(express.json({ limit: "256kb" }));

const corsOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  })
);

if (process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY) {
  app.use(clerkMiddleware());
} else {
  console.warn(
    "CLERK_SECRET_KEY / CLERK_PUBLISHABLE_KEY not set — protected routes will 401."
  );
}

app.use("/health", healthRouter);
app.use("/me", meRouter);
app.use("/profiles", profilesRouter);
app.use("/optimize", optimizeRouter);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`rally-lead-api listening on http://localhost:${port}`);
});
