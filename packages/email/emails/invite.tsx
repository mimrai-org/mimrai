import { getEmailUrl } from "@mimir/utils/envs";
import {
	Body,
	Container,
	Heading,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import { Footer } from "../components/footer";
import { Logo } from "../components/logo";
import {
	Button,
	EmailThemeProvider,
	getEmailInlineStyles,
	getEmailThemeClasses,
} from "../components/theme";

interface Props {
	teamId: string;
	inviteId: string;
	teamName: string;
}

const baseUrl = getEmailUrl();

export const InviteEmail = ({
	teamName = "Acme Inc.",
	inviteId,
	teamId = "",
}: Props) => {
	const text = `You've been invited to ${teamName}.`;
	const themeClasses = getEmailThemeClasses();
	const lightStyles = getEmailInlineStyles("light");

	return (
		<EmailThemeProvider preview={<Preview>{text}</Preview>}>
			<Body
				className={`mx-auto my-auto font-sans ${themeClasses.body}`}
				style={lightStyles.body}
			>
				<Container
					className={`mx-auto my-[40px] max-w-[600px] p-[20px] ${themeClasses.container}`}
					style={{
						borderStyle: "solid",
						borderWidth: 1,
						borderColor: lightStyles.container.borderColor,
					}}
				>
					<Logo />
					<Heading
						className={`mx-0 my-[30px] p-0 text-center font-normal text-[21px] ${themeClasses.heading}`}
						style={{ color: lightStyles.text.color }}
					>
						You've been invited to {teamName}
					</Heading>

					<br />

					<span
						className={`font-medium ${themeClasses.text}`}
						style={{ color: lightStyles.text.color }}
					>
						{"Hello,"}
					</span>
					<Text
						className={themeClasses.text}
						style={{ color: lightStyles.text.color }}
					>
						You've been invited to join the team <b>{teamName}</b> on Mimir. To
						get started, please create your account by clicking the button
						below.
					</Text>

					<Text
						className={themeClasses.mutedText}
						style={{ color: lightStyles.mutedText.color }}
					>
						Best regards, founder
					</Text>

					<br />

					<Section className="text-center">
						<Button href={`${baseUrl}/invites/${inviteId}`}>
							Join {teamName}
						</Button>
					</Section>

					<br />
					<br />
					<br />

					<Footer />
				</Container>
			</Body>
		</EmailThemeProvider>
	);
};

export default InviteEmail;
