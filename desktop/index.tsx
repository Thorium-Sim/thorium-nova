import "reflect-metadata";
import { render } from "@gpuix/react";

import { exit } from "../app/.server/init/exitHandler";
// @ts-expect-error
import thoriumSvg from "../app/images/logo.svg" with { type: "text" };
import { ipAddresses } from "../app/utils/ipaddresses";
import { openInBrowser } from "./openInBrowser";

function ThoriumApp({ log, url }: { log: string; url: URL | null }) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				width: "100%",
				height: "100%",
				backgroundColor: "#1a1a1a",
			}}
		>
			<img
				src={`data:image/svg+xml;base64,${Buffer.from(thoriumSvg).toBase64()}`}
				style={{ width: 256, height: 256, marginBottom: 32, marginTop: 32 }}
			/>
			<text style={{ color: "white", fontSize: 48, fontWeight: 700 }}>Thorium Nova</text>
			<text style={{ color: "white", fontSize: 24 }}>{log}</text>
			{url
				? ipAddresses.map((i) => {
						const u = new URL(url);
						u.hostname = i;

						return (
							<text
								key={u.toString()}
								style={{ color: "white", fontSize: 18 }}
								onClick={() => {
									openInBrowser(u.toString());
								}}
							>
								{u.toString()}
							</text>
						);
					})
				: null}
			<div
				style={{
					backgroundColor: "#313244",
					borderRadius: 8,
					paddingTop: 8,
					paddingBottom: 8,
					paddingLeft: 12,
					paddingRight: 12,
					marginTop: 12,
					color: "white",
					// @ts-expect-error
					hover: { backgroundColor: "#45475a" },
					active: { backgroundColor: "#585b70" },
				}}
				onClick={() => exit()}
			>
				Close Server
			</div>
		</div>
	);
}

const root = render(<ThoriumApp url={null} log="Thorium Nova is loading..." />, {
	title: "Thorium Nova",
	width: 940,
	height: 660,
	titlebarTransparent: true,
	windowBackground: "blurred",
	trafficLightX: 16,
	trafficLightY: 17,
	appName: "Thorium Nova",
	// Agent checks need real GPU paint, not control of the user's keyboard.
	focus: typeof process === "undefined" || process.env.GPUIX_BACKGROUND !== "1",
});
let address: string | null = null;
const worker = new Worker("./desktop/exe.ts");
worker.addEventListener("error", (event) => {
	console.error("Error in worker", event.message);
});
worker.addEventListener("message", (event) => {
	address = event.data.address ?? address;
	root.render(<ThoriumApp log={event.data.message} url={address ? new URL(address) : null} />);
});
