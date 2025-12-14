import { NotificationHeader } from "@/components/notifications/header";
import { NotificationList } from "@/components/notifications/list";

export default function Page() {
	return (
		<div className="space-y-4 py-4">
			<NotificationHeader />
			<NotificationList />
		</div>
	);
}
