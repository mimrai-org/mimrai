import { configure } from "@trigger.dev/sdk";

export const trigger = configure({
  accessToken: process.env.TRIGGER_SECRET_KEY,
});
