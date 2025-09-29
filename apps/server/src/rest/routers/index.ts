import { OpenAPIHono } from "@hono/zod-openapi";
import { protectedMiddleware } from "../middleware";
import { chatRouter } from "./chat";

const routers = new OpenAPIHono();

routers.use(...protectedMiddleware);

// Mount protected routes
routers.route("/chat", chatRouter);
