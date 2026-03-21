import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import { Aspect } from "./Aspect";
import type BasePlugin from "./index";
export default class ConversationPlugin extends Aspect {
	apiVersion = "conversation/v1" as const;
	kind = "conversations" as const;
	name: string;
	description: string;
	timelineId?: string;
	assets: {
		conversation: string;
		files: string[];
	};

	constructor(params: Partial<ConversationPlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Conversation",
			plugin.aspects.ships.map((theme) => theme.name),
		);
		// Figure out what type of timeline we're dealing with
		let timelineType = "missions";
		if (plugin.aspects.trainings.some((t) => t.name === params.timelineId)) {
			timelineType = "trainings";
		}
		if (plugin.aspects.reports.some((t) => t.name === params.timelineId)) {
			timelineType = "reports";
		}

		super({ name, ...params }, { kind: "conversations" }, plugin, {
			// Nest the conversation in the same folder as the timeline that it is used with
			// To prevent naming collisions between conversations from different timelines
			meta: params.timelineId
				? {
						filePath: `/plugins/${plugin.id}/${timelineType}/${params.timelineId}/conversations/${name}/manifest.yml`,
					}
				: undefined,
		});
		this.name = name;

		this.assets = params.assets || {
			conversation: "conversation.ink",
			files: [],
		};
		this.timelineId = params.timelineId;
		this.description = params.description || "";
	}

	async removeAsset(assetPath: string) {
		this.assets.files = this.assets.files.filter((file) => file !== assetPath);
	}
}
