import { ProcessTriggersSystem } from "@thorium/.server/systems/ProcessTriggersSystem";
import { ShortRangeCommPowerSystem } from "@thorium/.server/systems/ShortRangeCommPowerSystem";
import { TimerSystem } from "@thorium/.server/systems/TimerSystem";
import { thoriumContext } from "@thorium/utils/.server/context";
import {
	createMockDataContext,
	createMockRouter,
} from "@thorium/utils/.server/createMockDataContext";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";
import { executeBlocks } from "@thorium/utils/.server/executeBlocks";
import { measureAudioDurationMs } from "@thorium/utils/.server/ink/measureAudioDuration";
import { processTriggers } from "@thorium/utils/.server/processTriggers";
import { Entity } from "@thorium/utils/ecs";
import { it, aroundEach, expect, vi } from "vitest";

vi.mock("@thorium/utils/.server/ink/measureAudioDuration", async () => {
	return {
		measureAudioDurationMs: vi.fn(),
	};
});

aroundEach(async (runTest) => {
	await thoriumContext.run(
		{
			...testDataStoreProps,
			async readAsset(asset) {
				if (asset.endsWith("testInkPath"))
					return `
VAR playerShipName = "Voyager"
VAR playerShipId = 1
VAR npcShipId = 2
VAR conversationId = 3

Ranger: Hello there. This is a test message.
* [Crew: Action Time]
-> doAction
* [Crew: Event Time]
-> doEvent
* [Crew: Audio Time]
-> doAudio

= doAction
Action: alertLevel.update shipId: {playerShipId} alertLevel: 2
-> DONE

= doEvent
Event: alertLevel.update shipId: {playerShipId} eventHandler
-> DONE

= eventHandler
Ranger: Looks like that worked just fine.
-> DONE

= doAudio
Ranger: Great, let me just play this audio file. # rangerAudio.ogg

Ranger: And then this text line will appear.
* [Crew: That's great]
-> DONE
* [Crew: Glad to hear it]
-> DONE

    `;
				return "";
			},
		},
		async () => {
			await runTest();
		},
	);
});

it("should auto-connect hails if the target is an NPC with a template conversation", async () => {
	const {
		dataContext,
		router,
		ship1,
		shortRangeComm1,
		ship2,
		shortRangeComm2,
		conversationTemplate,
	} = setUpTests();

	expect(shortRangeComm1.components.isShortRangeComm?.state).toEqual("idle");
	expect(shortRangeComm2.components.isShortRangeComm?.state).toEqual("idle");

	shortRangeComm2.updateComponent("isShortRangeComm", {
		templateConversationId: conversationTemplate.id,
	});

	await router.shortRangeComm.hail({ shipId: ship1.id, targetId: ship2.id });
	expect(shortRangeComm1.components.isShortRangeComm?.state).toEqual("hailing");
	expect(shortRangeComm1.components.isShortRangeComm?.conversationId).toBeTruthy();
	expect(shortRangeComm2.components.isShortRangeComm?.state).toEqual("idle");

	const conversation = dataContext.ecs.getEntityById(
		shortRangeComm1.components.isShortRangeComm?.conversationId || -1,
	);
	expect(conversation?.components.isShortRangeCommConversation?.hostId).toEqual(ship1.id);
	expect(conversation?.components.isShortRangeCommConversation?.targetId).toEqual(ship2.id);

	// Wait for the conversation to connect
	dataContext.ecs.update(3000 + 4000);

	await new Promise((res) => process.nextTick(res));
	expect(shortRangeComm1.components.isShortRangeComm?.state).toEqual("connected");
	expect(shortRangeComm2.components.isShortRangeComm?.state).toEqual("connected");
});
it("should auto-reject hails if the target is an NPC with no template conversation", async () => {
	const { dataContext, router, ship1, shortRangeComm1, ship2, shortRangeComm2 } = setUpTests();

	expect(shortRangeComm1.components.isShortRangeComm?.state).toEqual("idle");
	expect(shortRangeComm2.components.isShortRangeComm?.state).toEqual("idle");

	await router.shortRangeComm.hail({ shipId: ship1.id, targetId: ship2.id });

	expect(shortRangeComm1.components.isShortRangeComm?.state).toEqual("hailing");
	expect(shortRangeComm1.components.isShortRangeComm?.conversationId).toBeTruthy();
	expect(shortRangeComm2.components.isShortRangeComm?.state).toEqual("idle");

	// Wait for the conversation to reject
	dataContext.ecs.update(3000 + 4000);

	await new Promise((res) => process.nextTick(res));

	expect(shortRangeComm1.components.isShortRangeComm?.state).toEqual("idle");
	expect(shortRangeComm2.components.isShortRangeComm?.state).toEqual("idle");
});
it("should allow another ship to join an existing conversation", async () => {
	const {
		dataContext,
		router,
		ship1,
		shortRangeComm1,
		ship2,
		shortRangeComm2,
		ship3,
		shortRangeComm3,
		conversationTemplate,
	} = setUpTests();

	shortRangeComm2.updateComponent("isShortRangeComm", {
		templateConversationId: conversationTemplate.id,
	});
	const { conversationId } = await router.shortRangeComm.hail({
		shipId: ship1.id,
		targetId: ship2.id,
		allowOtherParticipants: true,
	});
	// Wait for the conversation to connect
	dataContext.ecs.update(3000 + 4000);
	await new Promise((res) => process.nextTick(res));
	expect(shortRangeComm1.components.isShortRangeComm?.state).toEqual("connected");
	expect(shortRangeComm2.components.isShortRangeComm?.state).toEqual("connected");
	await router.shortRangeComm.connect({ shipId: ship3.id, conversationId });
	expect(shortRangeComm3.components.isShortRangeComm?.state).toEqual("connected");
	expect(shortRangeComm3.components.isShortRangeComm?.conversationId).toEqual(
		shortRangeComm2.components.isShortRangeComm?.conversationId,
	);
});
it("should forbid another ship from joining an existing conversation if that conversation does not allow other participants", async () => {
	const {
		dataContext,
		router,
		ship1,
		shortRangeComm1,
		ship2,
		shortRangeComm2,
		ship3,
		shortRangeComm3,
		conversationTemplate,
	} = setUpTests();

	shortRangeComm2.updateComponent("isShortRangeComm", {
		templateConversationId: conversationTemplate.id,
	});
	const { conversationId } = await router.shortRangeComm.hail({
		shipId: ship1.id,
		targetId: ship2.id,
		allowOtherParticipants: false,
	});
	// Wait for the conversation to connect
	dataContext.ecs.update(3000 + 4000);
	await new Promise((res) => process.nextTick(res));
	expect(shortRangeComm1.components.isShortRangeComm?.state).toEqual("connected");
	expect(shortRangeComm2.components.isShortRangeComm?.state).toEqual("connected");
	await expect(
		router.shortRangeComm.connect({ shipId: ship3.id, conversationId }),
	).rejects.toThrow();

	expect(shortRangeComm3.components.isShortRangeComm?.state).toEqual("idle");
	expect(shortRangeComm3.components.isShortRangeComm?.conversationId).toEqual(null);
});
it("should work when an NPC hails a player ship", async () => {
	const { router, ship1, shortRangeComm1, ship2, shortRangeComm2, conversationTemplate } =
		setUpTests();

	const { conversationId } = await router.shortRangeComm.hail({
		shipId: ship2.id,
		targetId: ship1.id,
		conversationTemplateId: conversationTemplate.id,
	});

	expect(shortRangeComm2.components.isShortRangeComm?.state).toEqual("hailing");
	expect(shortRangeComm2.components.isShortRangeComm?.conversationId).toEqual(conversationId);
	expect(shortRangeComm1.components.isShortRangeComm?.state).toEqual("idle");

	await router.shortRangeComm.connect({
		shipId: ship1.id,
		conversationId,
	});
	expect(shortRangeComm2.components.isShortRangeComm?.state).toEqual("connected");
	expect(shortRangeComm1.components.isShortRangeComm?.state).toEqual("connected");

	await router.shortRangeComm.disconnect({ shipId: ship1.id });
	expect(shortRangeComm2.components.isShortRangeComm?.state).toEqual("connected");
	expect(shortRangeComm1.components.isShortRangeComm?.state).toEqual("idle");
	expect(shortRangeComm1.components.isShortRangeComm?.conversationId).toEqual(null);
});
it("should properly follow an ink script, including triggering actions", async () => {
	const { dataContext, router, ship1, ship2, conversationTemplate } = setUpTests();

	const { conversationId } = await router.shortRangeComm.hail({
		shipId: ship2.id,
		targetId: ship1.id,
		conversationTemplateId: conversationTemplate.id,
	});
	await router.shortRangeComm.connect({
		shipId: ship1.id,
		conversationId,
	});

	const conversation = dataContext.ecs.getEntityById(conversationId);
	expect(conversation?.components.isConversation?.currentDialogue[0].text).toEqual(
		"Hello there. This is a test message.",
	);

	expect(ship1.components.isShip?.alertLevel).toEqual("5");
	await router.conversation.selectChoice({
		shipId: ship1.id,
		conversationId,
		choice: "Crew: Action Time",
	});
	expect(ship1.components.isShip?.alertLevel).toEqual("2");
});
it("should properly follow an ink script, including event listeners", async () => {
	const { dataContext, router, ship1, ship2, conversationTemplate } = setUpTests();

	const { conversationId } = await router.shortRangeComm.hail({
		shipId: ship2.id,
		targetId: ship1.id,
		conversationTemplateId: conversationTemplate.id,
	});
	await router.shortRangeComm.connect({
		shipId: ship1.id,
		conversationId,
	});

	const conversation = dataContext.ecs.getEntityById(conversationId);
	expect(conversation?.components.isConversation?.currentDialogue[0].text).toEqual(
		"Hello there. This is a test message.",
	);

	await router.conversation.selectChoice({
		shipId: ship1.id,
		conversationId,
		choice: "Crew: Event Time",
	});

	expect(conversation?.components.isConversation?.currentDialogue[0].text).toEqual(
		"Hello there. This is a test message.",
	);

	await router.alertLevel.update({ alertLevel: "1", shipId: ship1.id });

	await new Promise((res) => process.nextTick(res));

	expect(conversation?.components.isConversation?.currentDialogue[1].text).toEqual("Event Time");
	expect(conversation?.components.isConversation?.currentDialogue[2].text).toEqual(
		"Looks like that worked just fine.",
	);
});
it("should wait for an audio file to finish playing before continuing the story and mark the chosen choice as chosen until the next choices are available", async () => {
	const { dataContext, router, ship1, ship2, conversationTemplate } = setUpTests();

	const { conversationId } = await router.shortRangeComm.hail({
		shipId: ship2.id,
		targetId: ship1.id,
		conversationTemplateId: conversationTemplate.id,
	});
	await router.shortRangeComm.connect({
		shipId: ship1.id,
		conversationId,
	});
	const conversation = dataContext.ecs.getEntityById(conversationId);
	expect(conversation?.components.isConversation?.currentDialogue[0].text).toEqual(
		"Hello there. This is a test message.",
	);
	expect(conversation?.components.isConversation?.currentChoices[0].text).toEqual(
		"Crew: Action Time",
	);
	expect(conversation?.components.isConversation?.currentChoices[1].text).toEqual(
		"Crew: Event Time",
	);
	expect(conversation?.components.isConversation?.currentChoices[2].text).toEqual(
		"Crew: Audio Time",
	);

	(measureAudioDurationMs as any).mockReturnValue(1000);
	await router.conversation.selectChoice({
		shipId: ship1.id,
		conversationId,
		choice: "Crew: Audio Time",
	});
	expect(conversation?.components.isConversation?.currentDialogue[1].text).toEqual("Audio Time");
	expect(conversation?.components.isConversation?.currentDialogue[2].text).toEqual(
		"Great, let me just play this audio file.",
	);
	expect(conversation?.components.isConversation?.currentChoices[2].selected).toEqual(true);

	dataContext.ecs.update(1000 + 500);

	await new Promise((res) => process.nextTick(res));
	expect(conversation?.components.isConversation?.currentDialogue[3].text).toEqual(
		"And then this text line will appear.",
	);
	expect(conversation?.components.isConversation?.currentChoices[0].text).toEqual(
		"Crew: That's great",
	);
});

function setUpTests() {
	const dataContext = createMockDataContext();
	dataContext.ecs.executeBlocks = (blocks, blockMetadata) =>
		executeBlocks(dataContext.ecs, blocks, blockMetadata);
	dataContext.ecs.processTriggers = (events) => processTriggers(dataContext.ecs, events);

	const router = createMockRouter(dataContext, {
		onCall: (opts, result) => {
			const ecs = dataContext?.ecs;
			if (!ecs || opts.type !== "send") return;

			void processTriggers(ecs, {
				event: opts.path,
				values: {
					...(opts.rawInput as any),
					...(typeof result === "object" && !Array.isArray(result) ? result : {}),
				},
			});
		},
	});

	const conversationTemplate = new Entity();
	conversationTemplate.addComponent("isConversationTemplate", {
		inkFilePath: "testInkPath",
	});
	dataContext.ecs.addEntity(conversationTemplate);

	const ship1 = new Entity();
	ship1.addComponent("isShip");
	ship1.addComponent("isPlayerShip");
	ship1.addComponent("position");
	dataContext.ecs.addEntity(ship1);

	const shortRangeComm1 = new Entity();
	shortRangeComm1.addComponent("isShipSystem", { shipId: ship1.id });
	shortRangeComm1.addComponent("isShortRangeComm");
	dataContext.ecs.addEntity(shortRangeComm1);

	ship1.addComponent("shipSystems", {
		shipSystems: new Map([[shortRangeComm1.id, {}]]),
	});
	const ship2 = new Entity();
	ship2.addComponent("isShip");
	ship2.addComponent("position");
	ship2.addComponent("identity", { name: "Ranger" });
	dataContext.ecs.addEntity(ship2);

	const shortRangeComm2 = new Entity();
	shortRangeComm2.addComponent("isShipSystem", { shipId: ship2.id });
	shortRangeComm2.addComponent("isShortRangeComm");
	dataContext.ecs.addEntity(shortRangeComm2);
	ship2.addComponent("shipSystems", {
		shipSystems: new Map([[shortRangeComm2.id, {}]]),
	});

	const ship3 = new Entity();
	ship3.addComponent("isShip");
	ship3.addComponent("position");
	dataContext.ecs.addEntity(ship3);

	const shortRangeComm3 = new Entity();
	shortRangeComm3.addComponent("isShipSystem", { shipId: ship3.id });
	shortRangeComm3.addComponent("isShortRangeComm");
	dataContext.ecs.addEntity(shortRangeComm3);
	ship3.addComponent("shipSystems", {
		shipSystems: new Map([[shortRangeComm3.id, {}]]),
	});

	dataContext.ecs.addSystem(new ShortRangeCommPowerSystem());
	dataContext.ecs.addSystem(new ProcessTriggersSystem());
	dataContext.ecs.addSystem(new TimerSystem());

	return {
		router,
		dataContext,
		ship1,
		shortRangeComm1,
		ship2,
		shortRangeComm2,
		ship3,
		shortRangeComm3,
		conversationTemplate,
	};
}
