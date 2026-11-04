import { FeaturesGrid } from "@/components/sections/features-grid";
import { Hero } from "@/components/sections/hero";
import { OpenSource } from "@/components/sections/open-source";
import { ProductSection } from "@/components/sections/product-section";
import { Showcase } from "@/components/sections/showcase";

export default function Home() {
	return (
		<>
			<Hero />
			<ProductSection />
			<FeaturesGrid />
			<Showcase />
			<OpenSource />
		</>
	);
}
