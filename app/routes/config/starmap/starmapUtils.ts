import { lightYearToLightMinute } from "@thorium/utils/unitTypes";

// Colors chosen for maximum hue separation (~30-40° apart) so they remain
// distinguishable at the sphere's 0.2 opacity. Hue annotations are approximate.
const NETWORK_COLOR_PALETTE = [
	0x00b5a3, // teal      ~175°
	0x00cc44, // green     ~140°
	0xff8c00, // orange     ~33°
	0x9b59ff, // purple    ~265°
	0x00cfff, // cyan      ~195°
	0xff44ff, // magenta   ~300°
	0x4488ff, // blue      ~220°
	0xff4466, // rose      ~350°
	0xffdd00, // amber      ~52°
];

type StarEntry = {
	name: string;
	position: { x: number; y: number; z: number };
	commSatelliteRadius?: number | null;
};

export function computeNetworkColors(stars: StarEntry[]): Map<string, number> {
	const commStars = stars.filter((s) => s.commSatelliteRadius);
	if (commStars.length === 0) return new Map();

	// Union-Find with path compression and union by rank
	const parent = commStars.map((_, i) => i);
	const rank = new Array<number>(commStars.length).fill(0);

	function find(i: number): number {
		if (parent[i] !== i) parent[i] = find(parent[i]);
		return parent[i];
	}

	function union(i: number, j: number) {
		const pi = find(i);
		const pj = find(j);
		if (pi === pj) return;
		if (rank[pi] < rank[pj]) parent[pi] = pj;
		else if (rank[pi] > rank[pj]) parent[pj] = pi;
		else {
			parent[pj] = pi;
			rank[pi]++;
		}
	}

	// Build edges: two satellites are connected if distance ≤ either radius
	const radiiLM = commStars.map((s) =>
		lightYearToLightMinute(s.commSatelliteRadius!),
	);
	for (let i = 0; i < commStars.length; i++) {
		for (let j = i + 1; j < commStars.length; j++) {
			const dist = Math.hypot(
				commStars[i].position.x - commStars[j].position.x,
				commStars[i].position.y - commStars[j].position.y,
				commStars[i].position.z - commStars[j].position.z,
			);
			if (dist <= radiiLM[i] || dist <= radiiLM[j]) {
				union(i, j);
			}
		}
	}

	// Assign colors in list order so the first satellite in each component
	// anchors the color for that network
	const componentColors = new Map<number, number>();
	let nextColorIndex = 0;
	const result = new Map<string, number>();

	for (let i = 0; i < commStars.length; i++) {
		const root = find(i);
		if (!componentColors.has(root)) {
			componentColors.set(
				root,
				NETWORK_COLOR_PALETTE[nextColorIndex % NETWORK_COLOR_PALETTE.length],
			);
			nextColorIndex++;
		}
		result.set(commStars[i].name, componentColors.get(root)!);
	}

	return result;
}
