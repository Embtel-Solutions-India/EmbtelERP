import cors from "cors";
import express from "express";
import compression from "compression";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { employeesRouter } from "./routes/employees.routes.js";
import { hierarchyRouter } from "./routes/hierarchy.routes.js";
import { perspectivesRouter } from "./routes/perspectives.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { activitiesRouter } from "./routes/activities.routes.js";
import { auditRouter } from "./routes/audit.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "embtel-erp-server" });
  });

  app.use("/auth", authRouter);
  app.use("/employees", employeesRouter);
  app.use("/hierarchy", hierarchyRouter);
  app.use("/perspectives", perspectivesRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/activities", activitiesRouter);
  app.use("/audit-logs", auditRouter);

  app.use(errorHandler);
  return app;
}
