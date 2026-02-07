export interface GoogleCalendarEvent {
	id: string;
	summary?: string;
	description?: string;
	location?: string;
	start: {
		date?: string;
		dateTime?: string;
		timeZone?: string;
	};
	end: {
		date?: string;
		dateTime?: string;
		timeZone?: string;
	};
	status: string;
	htmlLink: string;
	created: string;
	updated: string;
	attendees?: Array<{
		email?: string;
		displayName?: string;
		responseStatus?: string;
	}>;
}
