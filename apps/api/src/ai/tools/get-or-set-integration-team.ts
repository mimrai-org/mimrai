// import { getAvailableTeams, switchTeam } from "@mimir/db/queries/users";
// import { tool } from "ai";
// import z from "zod";
// import { getContext, setContext } from "../context";
// import { getUserContext } from "../utils/get-user-context";

// export const getOrSetIntegrationTeamTool = tool({
//   description:
//     "Get or set the current integration team. If no teamId is provided, returns the available teams. If a teamId is provided, switches to that team if the user is a member.",
//   inputSchema: z.object({
//     teamId: z
//       .string()
//       .optional()
//       .describe(
//         "The database ID of the team to switch to. Get the ID calling the tool without a teamId."
//       ),
//   }),
//   execute: async ({ teamId }, context) => {
//     const { user, db, ...rest } = getContext();

//     const availableTeams = await getAvailableTeams(user.userId);

//     if (!teamId) {
//       return `Available teams: ${availableTeams.map((t) => `${t.name} <id:${t.id}>`).join(", ")}`;
//     }

//     if (teamId && !availableTeams.find((t) => t.id === teamId)) {
//       return `You are not a member of that team. Available teams are: ${availableTeams.map((t) => t.name).join(", ")}`;
//     }

//     // switch user team
//     const team = await switchTeam(user.userId, teamId);

//     const userContext = await getUserContext({
//       userId: user.userId,
//       teamId: team.teamId,
//     });

//     setContext({
//       db,
//       user: userContext,
//       ...rest,
//     });

//     return `Switched to team: ${team.name}`;
//   },
// });
