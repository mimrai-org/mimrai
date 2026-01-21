import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as locales from "./locales";

export let forceLocale: string | null = null;

export function setForceLocale(locale: string | null) {
	forceLocale = locale;
}

export type LocaleStore = {
	locale: string;
	timezone: string;
	setLocale: (state: Partial<LocaleStore>) => void;
};

export const useLocaleStore = create<LocaleStore>()(
	persist(
		(set, get) => ({
			locale: "en-US",
			timezone: "UTC",
			setLocale: (state: Partial<LocaleStore>) =>
				set((oldState) => ({ ...oldState, ...state })),
		}),
		{
			name: "team-store",
			storage: createJSONStorage(() => localStorage),
		},
	),
);

export const useLocale = () => {
	return useLocaleStore((state) => state.locale);
};

type DotNestedKeys<T> = T extends Record<string, any>
	? {
			[K in Extract<keyof T, string>]: T[K] extends Record<string, any>
				? K | `${K}.${string | DotNestedKeys<T[K]>}`
				: string | K;
		}[Extract<keyof T, string>]
	: never;

type TranslationKeys = DotNestedKeys<typeof locales.en>;

export function t(key: TranslationKeys): string {
	// let { locale } = useLocaleStore.getState();
	// if (locale) locale = locale.split("-")[0]!;
	// if (forceLocale) locale = forceLocale;
	// console.log("Locale in t():", forceLocale);

	const locale = "en";
	const parsedLocales = { ...locales } as Record<string, any>;
	const translations = parsedLocales[locale] ?? locales.en;
	const path = key.split(".");

	let result: any = translations;
	for (const segment of path) {
		result = result ? result[segment] : undefined;
	}

	if (!result) {
		// Fallback to en if translation not found
		result = locales.en;
		for (const segment of path) {
			result = result ? result[segment] : undefined;
		}
	}

	return result || key;
}
