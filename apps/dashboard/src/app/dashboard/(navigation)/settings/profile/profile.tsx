"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@mimir/ui/card";
import { useUser } from "@/hooks/use-user";
import { ProfileForm } from "./profile-form";

export const Profile = () => {
	const user = useUser();

	return (
		<Card>
			<CardHeader>
				<CardTitle>Profile Settings</CardTitle>
			</CardHeader>
			<CardContent>
				{user && (
					<ProfileForm
						defaultValues={{
							name: user.name,
							locale: user.locale || undefined,
						}}
					/>
				)}
			</CardContent>
		</Card>
	);
};
