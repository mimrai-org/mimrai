module.exports = {
	packagerConfig: {
		name: "mimrai",
		asar: true,
		osxSign: {},
		appCategoryType: "public.app-category.developer-tools",
	},
	makers: [
		{
			name: "@electron-forge/maker-squirrel",
			config: {
				executableName: "mimrai",
			},
		},
		{
			name: "@electron-forge/maker-zip",
			platforms: ["darwin"],
		},
		{
			name: "@electron-forge/maker-deb",
			config: {
				executableName: "mimrai",
			},
		},
		{
			name: "@electron-forge/maker-rpm",
			config: {
				executableName: "mimrai",
			},
		},
	],
	publishers: [
		{
			name: "@electron-forge/publisher-github",
			config: {
				repository: {
					owner: "mimrai-org",
					name: "mimrai",
				},
				prerelease: true,
			},
		},
	],
};
