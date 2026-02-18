import {
	AlertTriangle,
	Award,
	Bookmark,
	BookOpen,
	Brain,
	Bug,
	Calendar,
	Check,
	Clipboard,
	Clock,
	Cloud,
	Code,
	Database,
	Eye,
	File,
	Flag,
	Flame,
	Flower2,
	Folder,
	Gem,
	Gift,
	Globe,
	Hand,
	Heart,
	Key,
	Laptop,
	Leaf,
	Lightbulb,
	Link,
	Lock,
	MessageCircle,
	MessageSquare,
	Moon,
	Mountain,
	Newspaper,
	Notebook,
	Package,
	Palette,
	Pin,
	Rocket,
	ScrollText,
	Search,
	Settings,
	Shield,
	Smartphone,
	Sparkles,
	Star,
	Sun,
	Target,
	TreePine,
	Trophy,
	Users,
	Waves,
	Wifi,
	Wrench,
	Zap,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

// ─── Types ───────────────────────────────────────────────────────────

export type IconEntry =
	| { type: "emoji"; value: string }
	| { type: "image"; value: string }
	| { type: "component"; value: ComponentType<SVGProps<SVGSVGElement>> };

export type IconCategory = {
	label: string;
	icons: Record<string, IconEntry>;
};

export type IconRegistry = {
	categories: IconCategory[];
};

// ─── Registry ────────────────────────────────────────────────────────

const documentsCategory: IconCategory = {
	label: "Documents",
	icons: {
		"doc-file": { type: "component", value: File },
		"doc-folder": { type: "component", value: Folder },
		"doc-notebook": { type: "component", value: Notebook },
		"doc-book": { type: "component", value: BookOpen },
		"doc-bookmark": { type: "component", value: Bookmark },
		"doc-clipboard": { type: "component", value: Clipboard },
		"doc-scroll": { type: "component", value: ScrollText },
		"doc-newspaper": { type: "component", value: Newspaper },
		"doc-memo": { type: "component", value: File },
		"doc-envelope": { type: "component", value: Clipboard },
	},
};

const objectsCategory: IconCategory = {
	label: "Objects",
	icons: {
		"obj-lightbulb": { type: "component", value: Lightbulb },
		"obj-gear": { type: "component", value: Settings },
		"obj-wrench": { type: "component", value: Wrench },
		"obj-key": { type: "component", value: Key },
		"obj-lock": { type: "component", value: Lock },
		"obj-magnifier": { type: "component", value: Search },
		"obj-link": { type: "component", value: Link },
		"obj-pin": { type: "component", value: Pin },
		"obj-calendar": { type: "component", value: Calendar },
		"obj-clock": { type: "component", value: Clock },
	},
};

const symbolsCategory: IconCategory = {
	label: "Symbols",
	icons: {
		"sym-star": { type: "component", value: Star },
		"sym-heart": { type: "component", value: Heart },
		"sym-fire": { type: "component", value: Flame },
		"sym-bolt": { type: "component", value: Zap },
		"sym-sparkles": { type: "component", value: Sparkles },
		"sym-check": { type: "component", value: Check },
		"sym-warning": { type: "component", value: AlertTriangle },
		"sym-target": { type: "component", value: Target },
		"sym-flag": { type: "component", value: Flag },
		"sym-diamond": { type: "component", value: Gem },
	},
};

const peopleCategory: IconCategory = {
	label: "People",
	icons: {
		"ppl-wave": { type: "component", value: Hand },
		"ppl-brain": { type: "component", value: Brain },
		"ppl-eyes": { type: "component", value: Eye },
		"ppl-speech": { type: "component", value: MessageCircle },
		"ppl-thought": { type: "component", value: MessageSquare },
		"ppl-team": { type: "component", value: Users },
		"ppl-rocket": { type: "component", value: Rocket },
		"ppl-party": { type: "component", value: Gift },
		"ppl-medal": { type: "component", value: Award },
		"ppl-trophy": { type: "component", value: Trophy },
	},
};

const natureCategory: IconCategory = {
	label: "Nature",
	icons: {
		"nat-tree": { type: "component", value: TreePine },
		"nat-leaf": { type: "component", value: Leaf },
		"nat-flower": { type: "component", value: Flower2 },
		"nat-sun": { type: "component", value: Sun },
		"nat-moon": { type: "component", value: Moon },
		"nat-cloud": { type: "component", value: Cloud },
		"nat-rainbow": { type: "component", value: Palette },
		"nat-ocean": { type: "component", value: Waves },
		"nat-mountain": { type: "component", value: Mountain },
		"nat-earth": { type: "component", value: Globe },
	},
};

const techCategory: IconCategory = {
	label: "Tech",
	icons: {
		"tech-laptop": { type: "component", value: Laptop },
		"tech-phone": { type: "component", value: Smartphone },
		"tech-database": { type: "component", value: Database },
		"tech-globe": { type: "component", value: Globe },
		"tech-robot": { type: "component", value: Zap },
		"tech-satellite": { type: "component", value: Wifi },
		"tech-code": { type: "component", value: Code },
		"tech-bug": { type: "component", value: Bug },
		"tech-shield": { type: "component", value: Shield },
		"tech-package": { type: "component", value: Package },
	},
};

export const iconRegistry: IconRegistry = {
	categories: [
		documentsCategory,
		objectsCategory,
		symbolsCategory,
		peopleCategory,
		natureCategory,
		techCategory,
	],
};

// ─── Helpers ─────────────────────────────────────────────────────────

/** Flat lookup map built once from the registry */
const flatIconMap = new Map<string, IconEntry>();
for (const category of iconRegistry.categories) {
	for (const [key, entry] of Object.entries(category.icons)) {
		flatIconMap.set(key, entry);
	}
}

/**
 * Resolve an icon key to its entry. Returns `undefined` if the key is not
 * found so callers can fall back to a default.
 */
export function getIconEntry(
	key: string | null | undefined,
): IconEntry | undefined {
	if (!key) return undefined;
	return flatIconMap.get(key);
}

/**
 * Register additional icons at runtime (e.g. custom image URLs).
 * Merges into an existing category or creates a new one.
 */
export function registerIcons(
	categoryLabel: string,
	icons: Record<string, IconEntry>,
) {
	const existing = iconRegistry.categories.find(
		(c) => c.label === categoryLabel,
	);
	if (existing) {
		Object.assign(existing.icons, icons);
	} else {
		iconRegistry.categories.push({ label: categoryLabel, icons });
	}
	// Rebuild flat map
	for (const [key, entry] of Object.entries(icons)) {
		flatIconMap.set(key, entry);
	}
}
