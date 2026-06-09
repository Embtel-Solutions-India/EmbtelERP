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
import { marketingRouter } from "./routes/marketing.routes.js";
import { tasksRouter } from "./routes/tasks.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { workspaceRouter } from "./routes/workspace.routes.js";
import { documentsRouter } from "./routes/documents.routes.js";
import { calendarRouter } from "./routes/calendar.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
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
  app.use("/marketing", marketingRouter);
  app.use("/tasks", tasksRouter);
  app.use("/admin", adminRouter);
  app.use("/workspace", workspaceRouter);
  app.use("/documents", documentsRouter);
  app.use("/calendar", calendarRouter);

  app.use(errorHandler);
  return app;
}
