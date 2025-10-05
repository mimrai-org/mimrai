import { Img, Section, Text } from "@react-email/components";
import { getEmailThemeClasses } from "./theme";

type Props = {
	title: string;
	description: string;
	imgSrc: string;
	footer?: string;
};

export function Column({ title, description, footer, imgSrc }: Props) {
	const themeClasses = getEmailThemeClasses();

	return (
		<Section className="m-0 p-0 text-left">
			<Section className="m-0 mb-4 box-border inline-block w-[265px] p-0 text-left align-top md:mb-0">
				<Section className="m-0 p-0 pb-10 text-left">
					<Img src={imgSrc} alt={title} className="w-[245px]" />
				</Section>
			</Section>
			<Section className="box-border inline-block w-[280px] text-left align-top">
				<Section className="m-0 p-0 text-left">
					<Text className={`m-0 mb-2 pt-0 font-medium ${themeClasses.text}`}>
						{title}
					</Text>
					<Text className={`m-0 p-0 ${themeClasses.mutedText}`}>
						{description}
					</Text>
					<Text className={`mt-2 p-0 ${themeClasses.mutedText}`}>{footer}</Text>
				</Section>
			</Section>
		</Section>
	);
}
