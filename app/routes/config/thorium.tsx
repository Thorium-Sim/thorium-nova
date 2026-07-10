import { q } from "@thorium/context/AppContext";
import { InterpolateInfo } from "@thorium/routes/config/reports/InterpolateInfo";
import { TextInterpolateOutputField } from "@thorium/routes/config/ships/basic";
import Input from "@thorium/ui/Input";
import { useMenubar } from "@thorium/ui/Menubar";
import { Suspense } from "react";
import { href } from "react-router";

export default function ThoriumSettings() {
	const [settings] = q.thorium.settings.useNetRequest();
	useMenubar({ backTo: href("/config") });
	return (
		<div className="max-w-2xl p-8">
			<h1 className="mb-4 text-3xl font-bold text-white">Thorium Settings</h1>
			<div className="flex gap-2">
				<Input
					label={
						<div className="relative">
							Flight Name Template
							<InterpolateInfo className="top-0 right-0" />
						</div>
					}
					as="textarea"
					helperText="The template used to generate names for flights. Can reference text patterns from plugins."
					defaultValue={settings.flightNameTemplate}
					onBlur={(e) =>
						q.thorium.setFlightNameTemplate.netSend({ flightNameTemplate: e.currentTarget.value })
					}
				/>
				<Suspense>
					<TextInterpolateOutputField string={settings.flightNameTemplate} />
				</Suspense>
			</div>
			<div className="flex gap-2">
				<Input
					label={
						<div className="relative">
							Client Name Template
							<InterpolateInfo className="top-0 right-0" />
						</div>
					}
					helperText="The template used to generate names for new clients. Can reference text patterns from plugins."
					defaultValue={settings.clientNameTemplate}
					as="textarea"
					onBlur={(e) =>
						q.thorium.setClientNameTemplate.netSend({ clientNameTemplate: e.currentTarget.value })
					}
				/>
				<Suspense>
					<TextInterpolateOutputField string={settings.clientNameTemplate} />
				</Suspense>
			</div>
		</div>
	);
}
