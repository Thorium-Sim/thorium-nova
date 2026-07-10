import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { InterpolateInfo } from "@thorium/routes/config/reports/InterpolateInfo";
import { useConfirm } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import Input from "@thorium/ui/Input";
import throttle from "lodash.throttle";
import { startTransition, Suspense, useCallback, useState } from "react";
import { useNavigate, Navigate, href } from "react-router";

import type { Route } from "./+types/textPattern";

export default function TextPatternDetail({
	params: { textPatternId, pluginId },
}: Route.ComponentProps) {
	const navigate = useNavigate();
	const confirm = useConfirm();
	const [item] = q.plugin.textPattern.get.useNetRequest({
		pluginId,
		textPatternId,
	});
	const [error, setError] = useState(false);

	const setTextPattern = useCallback(
		throttle((textPattern: string) => {
			q.plugin.textPattern.update.netSend({
				pluginId,
				textPatternId,
				textPattern,
			});
		}, 100),
		[],
	);

	if (!textPatternId || !item)
		return <Navigate to={href("/config/:pluginId/textPatterns", { pluginId })} />;

	return (
		<fieldset key={textPatternId} className="flex flex-1 flex-col gap-4 overflow-y-auto">
			<div className="flex gap-4">
				<div className="flex min-w-1/3 flex-col gap-4">
					<Input
						labelHidden={false}
						isInvalid={error}
						invalidMessage="Name is required"
						label="Name"
						placeholder="Nouns"
						defaultValue={item.name}
						onChange={() => setError(false)}
						onBlur={async (e: any) => {
							if (!e.target.value) return setError(true);
							try {
								const result = await q.plugin.textPattern.update.netSend({
									pluginId,
									textPatternId,
									name: e.target.value,
								});
								void navigate(
									href("/config/:pluginId/textPatterns/:textPatternId", {
										pluginId,
										textPatternId: result.textPatternId,
									}),
								);
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error renaming text pattern",
										body: err.message,
										color: "error",
									});
								}
							}
						}}
					/>
					<Input
						labelHidden={false}
						label="Category"
						placeholder="Parts"
						defaultValue={item.category}
						onChange={() => setError(false)}
						onBlur={async (e: any) => {
							await q.plugin.textPattern.update.netSend({
								pluginId,
								textPatternId,
								category: e.target.value,
							});
						}}
					/>
				</div>
				<Input
					as="textarea"
					className="!h-32 flex-auto"
					labelHidden={false}
					label="Description"
					defaultValue={item.description}
					onBlur={(e: any) =>
						q.plugin.textPattern.update.netSend({
							pluginId,
							textPatternId,
							description: e.target.value,
						})
					}
				/>
			</div>
			<Input
				as="textarea"
				className="!h-32"
				labelHidden={false}
				label={
					<span className="relative">
						Text Pattern <InterpolateInfo className="top-0" basic />
					</span>
				}
				defaultValue={item.textPattern}
				onChange={(e) => setTextPattern(e.target.value)}
			/>
			<Suspense>
				<TextPatternOutputField textPatternId={textPatternId} pluginId={pluginId} />
			</Suspense>
			<div>
				<Button
					className="btn-outline btn-error btn-sm w-full"
					disabled={!textPatternId}
					onClick={async () => {
						if (
							!textPatternId ||
							!(await confirm({
								header: "Are you sure you want to delete this text pattern?",
							}))
						)
							return;
						await q.plugin.textPattern.delete.netSend({
							pluginId,
							textPatternId,
						});
						await navigate(`/config/${pluginId}/textPatterns`);
					}}
				>
					Delete Text Pattern
				</Button>
			</div>
		</fieldset>
	);
}

function TextPatternOutputField({
	textPatternId,
	pluginId,
}: {
	textPatternId: string;
	pluginId: string;
}) {
	const [randomSeed, setRandomSeed] = useState("thorium");

	const [stringOutput] = q.textPattern.evaluate.useNetRequest({
		textPatternId,
		pluginId,
		randomSeed,
	});

	return (
		<div className="flex items-end gap-2">
			<Input label="Output" readOnly value={stringOutput.output} />
			<Button
				className="btn-outline btn-warning"
				onClick={() => startTransition(() => setRandomSeed(Math.random().toString()))}
			>
				<Icon name="shuffle" />
			</Button>
		</div>
	);
}
