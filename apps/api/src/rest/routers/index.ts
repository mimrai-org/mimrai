import { OpenAPIHono } from "@hono/zod-openapi";
import { protectedMiddleware } from "../middleware";
import type { Context } from "../types";
import { attachmentsRouter } from "./attachments";
import { chatRouter } from "./chat";
import { githubRouter } from "./github";
import { gmail } from "./gmail";
import { googleCalendar } from "./google-calendar";
import { importsRouter } from "./imports";
import { integrationsRouter } from "./integrations";
import { realtimeRouter } from "./realtime";
import { slackRouter } from "./slack";
import { transcriptionRouter } from "./transcription";
import { usersRouter } from "./users";

const routers = new OpenAPIHono<Context>();

routers.use(...protectedMiddleware);

// Mount protected routes
routers.route("/chat", chatRouter);
routers.route("/integrations", integrationsRouter);
routers.route("/github", githubRouter);
routers.route("/imports", importsRouter);
routers.route("/attachments", attachmentsRouter);
routers.route("/slack", slackRouter);
routers.route("/transcription", transcriptionRouter);
routers.route("/google-calendar", googleCalendar);
routers.route("/gmail", gmail);
routers.route("/users", usersRouter);
routers.route("/realtime", realtimeRouter);

export { routers };
