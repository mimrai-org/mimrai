import { cn } from "@ui/lib/utils";
import { Loader2 } from "lucide-react";

export default function Loader({ className }: { className?: string }) {
	return <Loader2 className={cn("animate-spin", className)} />;
}
