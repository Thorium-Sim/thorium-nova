import { isStarbase } from "@thorium/ecs-components/isStarbase";
import type { satellite } from "@thorium/ecs-components/satellite";
import type z from "zod";

export class StarbasePlugin {
	type: "starbase";
	name: string;
	description: string;
	keyLocation: boolean;
	tags: string[];
	isStarbase: z.infer<typeof isStarbase>;
	mass: number;
	length: number;
	satellite: Omit<z.infer<typeof satellite>, "parentId"> & {
		parentId: string | null;
	};
	population: number;

	constructor(
		params: { name: string } & Partial<
			StarbasePlugin & {
				satellite: Partial<
					Omit<z.infer<typeof satellite>, "parentId"> & {
						parentId: string | null;
					}
				>;
			}
		>,
	) {
		this.type = "starbase";
		this.keyLocation = params.keyLocation || false;
		this.name = params.name;
		this.description = params.description || "";
		this.tags = params.tags || [];

		this.isStarbase = {
			assets: params.isStarbase?.assets || {
				logo: "",
				model: "",
				vanity: "",
				topView: "",
				sideView: "",
			},
		};
		this.mass = params.mass || 700_000_000_000;
		this.length = params.length || 1500;

		this.satellite = {
			axialTilt: params.satellite?.axialTilt || 0,
			eccentricity: params.satellite?.eccentricity || 0,
			inclination: params.satellite?.inclination || 0,
			semiMajorAxis: params.satellite?.semiMajorAxis || 0,
			orbitalArc: params.satellite?.orbitalArc || 0,
			showOrbit: true,
			parentId: params.satellite?.parentId || null,
		};

		this.population = params.population || 0;
	}
}
