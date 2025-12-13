export const generateTeamPrefix = (name: string) => {
	return generateTeamSlug(name).replace(/-/g, "").toUpperCase().slice(0, 3);
};

export const generateTeamSlug = (name: string) => {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
};
