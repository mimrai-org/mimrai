export const en = {
	common: {
		saveChanges: "Save Changes",
	},
	toasts: {
		profileUpdated: "Profile updated successfully",
	},
	notifications: {
		categories: {
			general: "General",
			tasks: "Tasks",
			resumes: "Resumes",
		},
		types: {
			task_assigned: {
				title: "Task Assigned",
				description: "Notify me when a task is assigned to me.",
			},
			resume_generated: {
				title: "Resume Generated",
				description:
					"Notify me when a resume summary is generated for my team.",
			},
			task_column_changed: {
				title: "Task Moved",
				description: "Notify me when a task is moved to a different column.",
			},
			task_comment: {
				title: "New comment on Task",
				description: "Notify me when someone comments on a task.",
			},
			checklist_item_created: {
				title: "Checklist Item Created",
				description:
					"Notify me when a new checklist item is created on a task.",
			},
			mention: {
				title: "Mentioned",
				description: "Notify me when I am mentioned in a task or comment.",
			},
			checklist_item_completed: {
				title: "Checklist Item Completed",
				description: "Notify me when a checklist item is completed on a task.",
			},
			daily_digest: {
				title: "Daily Digest",
				description:
					"Receive a daily summary of my pending tasks and activities.",
			},
			daily_eod: {
				title: "Daily End of Day Summary",
				description:
					"Receive a daily summary of my completed tasks and activities.",
			},
			follow_up: {
				title: "Follow-Up",
				description:
					"Receive follow-up messages to help keep my tasks on track.",
			},
		},
		channels: {
			in_app: "In-App",
			email: "Email",
			mattermost: "Mattermost",
			whatsapp: "WhatsApp",
		},
	},
	activities: {
		changes: {
			title: "Title",
			dueDate: "Due Date",
			columnId: "Column",
			assigneeId: "Assignee",
			description: "Description",
		},
	},
	forms: {
		teamForm: {
			name: {
				label: "Name",
			},
			email: {
				label: "Email",
			},
			locale: {
				label: "Locale",
				placeholder: "Select a locale",
			},
			timezone: {
				label: "Timezone",
				placeholder: "Select a timezone",
			},
			description: {
				label: "Description",
				placeholder: "ACME is a company that specializes in...",
			},
		},
		memberInviteForm: {
			email: {
				label: "Email",
			},
			submitButton: {
				label: "Send Invite",
			},
		},
		resumeSettingsForm: {
			enabled: {
				label: "Enable Resume Generation",
			},
			cronPrompt: {
				label: "When you want to receive the resume?",
				description:
					'Describe in natural language when you want to receive the resume. For example: "Every Monday at 9am" or "On the first day of each month at 8am".',
			},
			instructions: {
				label: "Instructions",
			},
			alert: {
				description:
					"Keep in mind that your next resume wont be generated today",
			},
			submitButton: {
				label: "Save Settings",
			},
			testButton: {
				label: "Test Settings",
			},
		},
	},
	settings: {
		general: {
			team: {
				title: "Team Settings",
			},
		},
		members: {
			invite: {
				description: "Invite new members to your team by email.",
			},
			membersList: {
				title: "Members",
			},
			pendingInvites: {
				title: "Pending Invites",
			},
		},
		labels: {
			title: "Labels",
			description: "Manage the labels for your tasks.",
			table: {
				name: "Name",
				tasks: "Tasks",
				createdAt: "Created At",
			},
			actions: {
				edit: "Edit",
				delete: "Delete",
			},
		},
		notifications: {
			description: "Configure your notification preferences here.",
		},
		resumes: {
			description: "Configure your resume here.",

			activity: {
				title: "Activity",
			},
		},
		integrations: {
			title: "Integrations",
			github: {
				description: "Github integration",
			},
			mattermost: {
				description: "Open-source messaging platform",
			},
		},
		import: {
			tasks: {
				title: "Import Tasks",
				description:
					"Import tasks from a CSV file. Make sure your CSV file is formatted correctly.",

				table: {
					fileName: "File Name",
					status: "Status",
					uploadedAt: "Uploaded At",
				},
			},
		},
		sidebar: {
			general: "General",
			profile: "Profile",
			billing: "Billing",
			members: "Members",
			labels: "Labels",
			columns: "Columns",
			notifications: "Notifications",
			resumes: "Resumes",
			integrations: "Integrations",
			import: "Import",
		},
	},
};
