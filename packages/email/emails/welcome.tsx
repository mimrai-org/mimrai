import { getEmailUrl } from "@mimir/utils/envs";
import {
	Body,
	Container,
	Heading,
	Img,
	Link,
	Preview,
	Text,
} from "@react-email/components";
import { Footer } from "../components/footer";
import { GetStarted } from "../components/get-started";
import { Logo } from "../components/logo";
import {
	EmailThemeProvider,
	getEmailInlineStyles,
	getEmailThemeClasses,
} from "../components/theme";

interface Props {
	fullName: string;
}

const baseUrl = getEmailUrl();

export const WelcomeEmail = ({ fullName = "" }: Props) => {
	const firstName = fullName ? fullName.split(" ").at(0) : "";
	const text = `${firstName ? `Hi ${firstName}, ` : ""}Welcome to Mimir! I'm Alain, the founder.`;
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
						Welcome to Mimir
					</Heading>

					<br />

					<span
						className={`font-medium ${themeClasses.text}`}
						style={{ color: lightStyles.text.color }}
					>
						{firstName ? `Hi ${firstName},` : "Hello,"}
					</span>
					<Text
						className={themeClasses.text}
						style={{ color: lightStyles.text.color }}
					>
						Welcome to Mimir! I'm Alain, the founder.
						<br />
						<br />
						If there's anything we can do to help, just reply. We're always one
						message away.
					</Text>

					<br />

					<Text
						className={themeClasses.mutedText}
						style={{ color: lightStyles.mutedText.color }}
					>
						Best regards, founder
					</Text>

					<br />

					<GetStarted />

					<br />

					<Footer />
				</Container>
			</Body>
		</EmailThemeProvider>
	);
};

export default WelcomeEmail;
