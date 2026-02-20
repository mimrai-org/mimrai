import { cn } from "@ui/lib/utils";
import Image from "next/image";

const icons = {
	gmail: "/icons/gmail.svg",
	mattermost: "/icons/mattermost.svg",
	slack: "/icons/slack.svg",
	whatsapp: "/icons/whatsapp.svg",
	github: "/icons/github.svg",
	"google-calendar": "/icons/gcalendar.svg",
	smtp: "/icons/gmail.svg",
};

export const IntegrationIcon = ({
	type,
	className,
}: {
	type: string;
	className?: string;
}) => {
	const iconSrc = icons[type as keyof typeof icons];
	if (!iconSrc) return null;
	return (
		<Image
			src={iconSrc}
			alt={`${type} icon`}
			width={32}
			height={32}
			className={cn("inline-block size-10", className)}
		/>
	);
};
