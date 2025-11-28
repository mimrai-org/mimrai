import { OpenAPIHono } from "@hono/zod-openapi";
import { protectedMiddleware } from "../middleware";
import type { Context } from "../types";
import { attachmentsRouter } from "./attachments";
import { chatRouter } from "./chat";
import { githubRouter } from "./github";
import gmailOAuthRouter from "./gmail-oauth";
import { importsRouter } from "./imports";
import { integrationsRouter } from "./integrations";
import { slackRouter } from "./slack";
import { transcriptionRouter } from "./transcription";

const routers = new OpenAPIHono<Context>();

// Mount Gmail OAuth routes BEFORE auth middleware (they handle auth internally)
routers.route("/integrations/gmail", gmailOAuthRouter);

// Apply auth middleware to all other routes
routers.use(...protectedMiddleware);

routers.route("/chat", chatRouter);
routers.route("/integrations", integrationsRouter);
routers.route("/github", githubRouter);
routers.route("/imports", importsRouter);
routers.route("/attachments", attachmentsRouter);
routers.route("/slack", slackRouter);
routers.route("/transcription", transcriptionRouter);

export { routers };
