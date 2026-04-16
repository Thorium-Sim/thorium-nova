import {
	CoreShortRangeHailerEvent,
	CoreShortRangePickHailerEvent,
	CoreShortRangePickTargetEvent,
	CoreShortRangeTargetEvent,
} from "@thorium/cards/ShortRangeComm/events";
import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import { q } from "@thorium/context/AppContext";
import useEventListener from "@thorium/hooks/useEventListener";
import { useActiveCores } from "@thorium/routes/core/CoreFlexLayout";
import Button from "@thorium/ui/Button";
import { OutputField } from "@thorium/ui/Core";
import Select from "@thorium/ui/Select";
import { Suspense } from "react";
import { flushSync } from "react-dom";

export function ShortRangeCommEditor({ id }: { id: number }) {
	const activeCores = useActiveCores();
	const shortRangeComposerComponent = activeCores.find(
		(c) => c.component === "ShortRangeCommCore",
	);

	return (
		<div className="mt-2 flex flex-col gap-1">
			<Suspense>
				<ShortRangeState id={id} />
			</Suspense>
			{shortRangeComposerComponent ? (
				<div className="flex gap-1">
					<Button
						title="Hail From Entity"
						className="btn-success btn-xs flex-auto"
						onClick={() => {
							flushSync(() => {
								shortRangeComposerComponent.activate();
							});
							window.dispatchEvent(new CoreShortRangeHailerEvent(id));
						}}
					>
						Hail From Entity
					</Button>
					<Button
						title="Hail To Entity"
						className="btn-info btn-xs flex-auto"
						onClick={() => {
							flushSync(() => {
								shortRangeComposerComponent.activate();
							});
							window.dispatchEvent(new CoreShortRangeTargetEvent(id));
						}}
					>
						Hail To Entity
					</Button>
				</div>
			) : null}
		</div>
	);
}
function ShortRangeState({ id }: { id: number }) {
	const [shipComm] = q.shortRangeComm.get.useNetRequest({ shipId: id || -1 });

	return (
		<>
			<OutputField className="text-xs flex-auto">
				State: {shipComm ? shipComm.state : "No Short Range Comm"}
			</OutputField>
			<ConversationSelect
				selected={shipComm ? shipComm.templateConversationId : null}
				shipId={id}
			/>
		</>
	);
}

export function ConversationSelect({
	shipId,
	selected,
}: {
	shipId: number;
	selected: number | null;
}) {
	const [conversationTemplates] =
		q.conversation.conversationTemplates.useNetRequest();

	return (
		<Select
			size="xs"
			items={conversationTemplates.map((c) => ({ id: c.id, label: c.name }))}
			label="Conversation Template"
			selected={selected}
			setSelected={(value) =>
				q.shortRangeComm.setTemplateConversation.netSend({
					templateConversationId: value,
					shipId,
				})
			}
		/>
	);
}

export function usePickShortRangeComm() {
	const useStarmapStore = useGetStarmapStore();
	useEventListener(CoreShortRangePickHailerEvent.name, () => {
		useStarmapStore.setState({
			clickAction: {
				label: "Choose a ship to send the hail.",
				action: (object) => {
					if (!object) {
						useStarmapStore.setState({ clickAction: undefined });
						return;
					}

					window.dispatchEvent(new CoreShortRangeHailerEvent(object));

					useStarmapStore.setState({ clickAction: undefined });
				},
			},
		});
	});
	useEventListener(CoreShortRangePickTargetEvent.name, () => {
		useStarmapStore.setState({
			clickAction: {
				label: "Choose a ship to receive the hail.",
				action: (object) => {
					if (!object) {
						useStarmapStore.setState({ clickAction: undefined });
						return;
					}

					window.dispatchEvent(new CoreShortRangeTargetEvent(object));

					useStarmapStore.setState({ clickAction: undefined });
				},
			},
		});
	});
}
