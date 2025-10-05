import { getEmailUrl } from "@mimir/utils/envs";
import { Hr, Section, Text } from "@react-email/components";
import { getEmailInlineStyles, getEmailThemeClasses } from "./theme";

const baseUrl = getEmailUrl();

export function Footer() {
	const themeClasses = getEmailThemeClasses();
	const lightStyles = getEmailInlineStyles("light");

	return (
		<Section className="w-full">
			<Hr
				className={themeClasses.border}
				style={{ borderColor: lightStyles.container.borderColor }}
			/>

			<br />

			<Text
				className={`font-regular text-[21px] ${themeClasses.text}`}
				style={{ color: lightStyles.text.color }}
			>
				Run your business smarter.
			</Text>

			<br />
			<br />

			<Text
				className={`text-xs ${themeClasses.secondaryText}`}
				style={{ color: lightStyles.secondaryText.color }}
			>
				Mimir
			</Text>
		</Section>
	);
}
