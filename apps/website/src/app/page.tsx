import { FeaturesGrid } from "@/components/sections/features-grid";
import { Hero } from "@/components/sections/hero";
import { Newsletter } from "@/components/sections/newsletter";
import { OpenSource } from "@/components/sections/open-source";
import { ProductSection } from "@/components/sections/product-section";
import { Showcase } from "@/components/sections/showcase";
import { TrustedBy } from "@/components/sections/trusted-by";

export default function Home() {
	return (
		<>
			<Hero />
			<TrustedBy />
			<ProductSection />
			<FeaturesGrid />
			<Showcase />
			<OpenSource />
			<Newsletter />
		</>
	);
}
