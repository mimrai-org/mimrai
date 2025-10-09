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
	userName: string;
	url: string;
}

const baseUrl = getEmailUrl();

export const EmailVerificationEmail = ({
	userName = "Jhon Doe",
	url = "",
}: Props) => {
	const text = "Please verify your email address to complete your sign up.";
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
						Verify your email address.
					</Heading>

					<br />

					<span
						className={`font-medium ${themeClasses.text}`}
						style={{ color: lightStyles.text.color }}
					>
						Hi {userName},
					</span>
					<Text
						className={themeClasses.text}
						style={{ color: lightStyles.text.color }}
					>
						{"Please verify your email address to complete your sign up."}
						<br />
					</Text>
					<Text>
						If you did not create an account, no further action is required.
					</Text>

					<Text
						className={themeClasses.mutedText}
						style={{ color: lightStyles.mutedText.color }}
					>
						Best regards, founder
					</Text>

					<br />

					<Section className="text-center">
						<Button href={`${url}`}>Confirm my email</Button>
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

export default EmailVerificationEmail;
