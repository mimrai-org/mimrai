import { InviteEmail } from "@mimir/email/emails/invite";
import {
	changeOwner,
	createTeam,
	getMemberById,
	getMembers,
	getTeamById,
	leaveTeam,
	updateMember,
	updateTeam,
} from "@/db/queries/teams";
import {
	acceptTeamInvite,
	createTeamInvite,
	getTeamInviteById,
	getTeamInvites,
} from "@/db/queries/user-invites";
import { getAvailableTeams } from "@/db/queries/users";
import { resend } from "@/lib/resend";
import {
	acceptTeamInviteSchema,
	createTeamInviteSchema,
	createTeamSchema,
	getMemberByIdSchema,
	getTeamInviteByIdSchema,
	getTeamInvitesSchema,
	removeMemberSchema,
	transferOwnershipSchema,
	updateMemberSchema,
	updateTeamSchema,
} from "@/schemas/teams";
import { protectedProcedure, router } from "@/trpc/init";

export const teamsRouter = router({
	getAvailable: protectedProcedure.query(async ({ ctx }) => {
		const teams = await getAvailableTeams(ctx.user.id);
		return teams;
	}),

	create: protectedProcedure
		.meta({ scopes: ["team:write"] })
		.input(createTeamSchema)
		.meta({
			team: false,
		})
		.mutation(async ({ ctx, input }) => {
			const team = await createTeam({ ...input, userId: ctx.user.id });
			return team;
		}),

	getCurrent: protectedProcedure.query(async ({ ctx }) => {
		const team = await getTeamById(ctx.user.teamId!);
		return team;
	}),

	update: protectedProcedure
		.meta({ scopes: ["team:write"] })
		.input(updateTeamSchema)
		.mutation(async ({ ctx, input }) => {
			return updateTeam({
				...input,
				id: ctx.user.teamId!,
			});
		}),

	getMembers: protectedProcedure.query(async ({ ctx }) => {
		const members = await getMembers({
			teamId: ctx.user.teamId!,
		});
		return members;
	}),

	acceptInvite: protectedProcedure
		.meta({
			team: false,
		})
		.input(acceptTeamInviteSchema)
		.mutation(async ({ ctx, input }) => {
			const invite = await acceptTeamInvite({
				userId: ctx.user.id,
				userInviteId: input.inviteId,
			});
			return invite;
		}),

	getInviteById: protectedProcedure
		.meta({
			team: false,
		})
		.input(getTeamInviteByIdSchema)
		.query(async ({ ctx, input }) => {
			return getTeamInviteById(input.inviteId);
		}),

	getInvites: protectedProcedure
		.input(getTeamInvitesSchema.optional())
		.query(async ({ ctx, input }) => {
			return getTeamInvites({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	invite: protectedProcedure
		.meta({ scopes: ["team:write"] })
		.input(createTeamInviteSchema)
		.mutation(async ({ ctx, input }) => {
			const invite = await createTeamInvite({
				email: input.email,
				teamId: ctx.user.teamId!,
				invitedBy: ctx.user.id,
			});

			await resend.emails.send({
				from: "Mimir <mimir@grupo-titanio.com>",
				to: invite.email!,
				subject: "You're invited to join a team on Mimir",
				react: InviteEmail({
					inviteId: invite.id!,
					teamId: invite.teamId!,
					teamName: invite.team.name,
				}),
			});
			console.log("Invite email sent to", invite.email);

			return invite;
		}),

	leave: protectedProcedure.mutation(async ({ ctx }) => {
		return await leaveTeam(ctx.user.id, ctx.user.teamId!);
	}),

	updateMember: protectedProcedure
		.meta({ scopes: ["team:write"] })
		.input(updateMemberSchema)
		.mutation(async ({ ctx, input }) => {
			return updateMember({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	getMemberById: protectedProcedure
		.input(getMemberByIdSchema)
		.query(async ({ ctx, input }) => {
			return await getMemberById({
				userId: input.userId,
				teamId: ctx.user.teamId!,
			});
		}),

	removeMember: protectedProcedure
		.meta({ scopes: ["team:write"] })
		.input(removeMemberSchema)
		.mutation(async ({ ctx, input }) => {
			if (input.userId === ctx.user.id) {
				throw new Error("You cannot remove yourself");
			}

			return await leaveTeam(input.userId, ctx.user.teamId!);
		}),

	transferOwnership: protectedProcedure
		.meta({ scopes: ["team:write"] })
		.input(transferOwnershipSchema)
		.mutation(async ({ ctx, input }) => {
			if (input.userId === ctx.user.id) {
				throw new Error("You cannot transfer ownership to yourself");
			}

			return await changeOwner({
				teamId: ctx.user.teamId!,
				userId: input.userId,
			});
		}),
});
