import { stripeClient } from "@api/lib/payments";
import { resend } from "@api/lib/resend";
import {
	acceptTeamInviteSchema,
	createTeamInviteSchema,
	createTeamSchema,
	deleteTeamInviteSchema,
	getInvitesByEmailSchema,
	getMemberByIdSchema,
	getMembersSchema,
	getTeamInviteByIdSchema,
	getTeamInvitesSchema,
	removeMemberSchema,
	transferOwnershipSchema,
	updateMemberSchema,
	updateTeamSchema,
} from "@api/schemas/teams";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	checkLimit,
	createTrialSubscription,
	updateSubscriptionUsage,
} from "@mimir/billing";
import {
	changeOwner,
	createTeam,
	deleteTeam,
	getMemberById,
	getMembers,
	getTeamById,
	leaveTeam,
	linkCustomerToTeam,
	updateMember,
	updateTeam,
} from "@mimir/db/queries/teams";
import {
	acceptTeamInvite,
	createTeamInvite,
	deleteTeamInvite,
	getTeamInviteById,
	getTeamInvites,
	getTeamInvitesByEmail,
} from "@mimir/db/queries/user-invites";
import { getAvailableTeams } from "@mimir/db/queries/users";
import { InviteEmail } from "@mimir/email/emails/invite";
import { TRPCError } from "@trpc/server";

export const teamsRouter = router({
	getAvailable: protectedProcedure
		.meta({
			team: false,
		})
		.query(async ({ ctx }) => {
			const teams = await getAvailableTeams(ctx.user.id);
			return teams;
		}),

	create: protectedProcedure
		.input(createTeamSchema)
		.meta({
			team: false,
		})
		.mutation(async ({ ctx, input }) => {
			const team = await createTeam({ ...input, userId: ctx.user.id });

			// Create a customer in Stripe
			const customer = await stripeClient.customers.create({
				name: team.name,
				email: team.email,
				metadata: {
					teamId: team.id,
				},
			});

			// Link the customer to the team
			await linkCustomerToTeam({
				teamId: team.id,
				customerId: customer.id,
			});

			if (process.env.DISABLE_BILLING === "true") {
				return team;
			}

			// Create a trial subscription for the team
			await createTrialSubscription({
				teamId: team.id,
				recurringInterval: "monthly",
			});

			return team;
		}),

	getCurrent: protectedProcedure.query(async ({ ctx }) => {
		const team = await getTeamById(ctx.user.teamId!);
		if (!team.customerId) {
			const customer = await stripeClient.customers.create({
				name: team.name,
				email: team.email,
				metadata: {
					teamId: team.id,
				},
			});

			await linkCustomerToTeam({
				teamId: team.id,
				customerId: customer.id,
			});
		}

		return team;
	}),

	update: protectedProcedure
		.meta({ scopes: ["team:write"] })
		.input(updateTeamSchema)
		.mutation(async ({ ctx, input }) => {
			const oldTeam = await getTeamById(ctx.user.teamId!);
			const team = await updateTeam({
				...input,
				id: ctx.user.teamId!,
			});

			const {
				data: [existingCustomer],
			} = await stripeClient.customers.list({
				email: oldTeam.email,
				limit: 1,
			});

			// Update the customer in Stripe if it exists
			if (existingCustomer) {
				await stripeClient.customers.update(existingCustomer.id, {
					name: team!.name,
					email: team!.email,
				});
			} else {
				// Create a new customer in Stripe if it doesn't exist
				const customer = await stripeClient.customers.create({
					name: team!.name,
					email: team!.email,
					metadata: {
						teamId: team!.id,
					},
				});
				await linkCustomerToTeam({
					teamId: team!.id,
					customerId: customer.id,
				});
			}
		}),

	getMembers: protectedProcedure
		.input(getMembersSchema.optional())
		.query(async ({ ctx, input }) => {
			const members = await getMembers({
				...input,
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
			const canInvite = await checkLimit({
				teamId: ctx.user.teamId!,
				type: "users",
				movement: 1,
			});

			if (!canInvite) {
				throw new Error("Team user limit reached");
			}

			const invite = await acceptTeamInvite({
				userId: ctx.user.id,
				userInviteId: input.inviteId,
			});

			// Update the subscription with the new user count
			updateSubscriptionUsage({ teamId: invite.teamId, type: "users" });

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

	getInvitesByEmail: protectedProcedure
		.meta({
			team: false,
		})
		.input(getInvitesByEmailSchema)
		.query(async ({ ctx }) => {
			return getTeamInvitesByEmail({
				email: ctx.user.email,
			});
		}),

	invite: protectedProcedure
		.meta({ scopes: ["team:write"] })
		.input(createTeamInviteSchema)
		.mutation(async ({ ctx, input }) => {
			const canInvite = await checkLimit({
				teamId: ctx.user.teamId!,
				type: "users",
				movement: 1,
			});

			if (!canInvite) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Team user limit reached",
					cause: "TEAM_USER_LIMIT_REACHED",
				});
			}

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
					email: invite.email!,
				}),
			});
			console.log("Invite email sent to", invite.email);

			return invite;
		}),

	leave: protectedProcedure.mutation(async ({ ctx }) => {
		const membership = await leaveTeam(ctx.user.id, ctx.user.teamId!);
		// Update the subscription with the new user count
		updateSubscriptionUsage({ teamId: ctx.user.teamId!, type: "users" });
		return membership;
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

			const membership = await leaveTeam(input.userId, ctx.user.teamId!);
			// Update the subscription with the new user count
			updateSubscriptionUsage({ teamId: ctx.user.teamId!, type: "users" });
			return membership;
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

	deleteInvite: protectedProcedure
		.meta({ scopes: ["team:write"] })
		.input(deleteTeamInviteSchema)
		.mutation(async ({ ctx, input }) => {
			return deleteTeamInvite({
				inviteId: input.inviteId,
				teamId: ctx.user.teamId!,
			});
		}),

	delete: protectedProcedure
		.meta({ scopes: ["team:write"] })
		.mutation(async ({ ctx }) => {
			const team = await deleteTeam(ctx.user.teamId!);

			// Cancel the subscription in Stripe if it exists
			if (team.subscriptionId) {
				await stripeClient.subscriptions.cancel(team.subscriptionId!);
			}

			return team;
		}),
});
