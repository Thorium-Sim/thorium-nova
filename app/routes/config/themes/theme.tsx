import { AspectAssetUpload } from "@thorium/components/AspectAssetUpload";
import { Editor } from "@thorium/components/MonacoEditor";
import StationLayout from "@thorium/components/Station/StationLayout";
import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { useLocalStorage } from "@thorium/hooks/useLocalStorage";
import colorLogo from "@thorium/images/logo-color.svg?url";
import normalLogo from "@thorium/images/logo.svg?url";
import { StationData } from "@thorium/routes/station/useStation";
import { useConfirm, usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import Input from "@thorium/ui/Input";
import { MockNetRequestContext } from "@thorium/utils/live-query/client/mockContext";
import debounce from "lodash.debounce";
import { useState } from "react";
import { Navigate, Outlet, useParams, useNavigate } from "react-router";

export default function ThemeLayout() {
	const { themeId, pluginId } = useParams() as {
		themeId: string;
		pluginId: string;
	};
	const navigate = useNavigate();
	const confirm = useConfirm();
	const prompt = usePrompt();
	const [theme] = q.plugin.theme.get.useNetRequest({ pluginId, themeId });

	const [shipName, setShipName] = useLocalStorage("theme-ship-name", "USS Testing");
	const [stationName, setStationName] = useLocalStorage("theme-station-name", "Command");
	const [alertLevel, setAlertLevel] = useLocalStorage("theme-notice-level", "5");

	const [previewViewscreen, setPreviewViewscreen] = useState(false);

	if (!themeId || !theme) return <Navigate to={`/config/${pluginId}/themes`} />;
	return (
		<>
			<div className="flex w-full gap-8">
				<div className="flex h-full grow flex-col gap-2">
					<Editor
						className="flex-1"
						defaultValue={theme.rawCSS}
						onChange={debounce(
							async (e) => {
								await q.plugin.theme.update.netSend({
									pluginId: pluginId,
									themeId: themeId,
									rawCSS: e,
								});
							},
							300,
							{ trailing: true, maxWait: 1000 },
						)}
						theme="vs-dark"
						language="less"
						options={{
							minimap: {
								enabled: false,
							},
						}}
					/>

					<div className="flex gap-4">
						<Button
							className="btn-outline btn-error"
							disabled={!themeId}
							onClick={async () => {
								if (
									!themeId ||
									!(await confirm({
										header: "Are you sure you want to delete this theme?",
										body: "All content for this theme, including images and other assets, will be gone forever.",
									}))
								)
									return;
								void q.plugin.theme.delete.netSend({ pluginId, themeId });
								void navigate(`/config/${pluginId}/themes`);
							}}
						>
							Delete Theme
						</Button>
						<Button
							className="btn-outline btn-notice"
							disabled={!themeId}
							onClick={async () => {
								if (!pluginId) return;
								const name = await prompt({
									header: "What is the name of the duplicated plugin?",
								});
								if (!name || typeof name !== "string") return;
								try {
									const result = await q.plugin.theme.duplicate.netSend({
										pluginId: pluginId,
										themeId,
										name,
									});
									void navigate(`/config/${pluginId}/themes/${result.themeId}`);
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error duplicating plugin",
											body: err.message,
											color: "error",
										});
										return;
									}
								}
							}}
						>
							Duplicate Theme
						</Button>
						<Button
							className="btn-outline btn-info"
							disabled={!themeId}
							onClick={() => setPreviewViewscreen((v) => !v)}
						>
							Preview {previewViewscreen ? "Station" : "Viewscreen"}
						</Button>
					</div>
				</div>
				<div className="flex w-[384px] flex-1 grow-0 flex-col">
					<div
						className="relative z-10 w-[384px] origin-top-right transform overflow-hidden border border-white bg-black transition-transform hover:scale-[3]"
						style={{
							aspectRatio: "16/9",
						}}
					>
						<div
							className="absolute top-0 left-0 h-[1080px] w-[1920px] bg-gray-800"
							style={{
								transform: `scale(0.2) translate(-200%, -200%)`,
							}}
						>
							<style
								dangerouslySetInnerHTML={{
									__html: theme.rawCSS,
								}}
							/>
							<MockNetRequestContext.Provider
								value={{
									client: {
										get: {
											id: "Test",
											name: "Test Client",
											connected: true,
											loginName: "Test User",
										},
									} as any,
									flight: {
										active: {
											state: "in-progress",
											paused: false,
										},
									},
									ship: {
										get: {
											id: 0,
											components: {
												isPlayerShip: { value: true },
												identity: { name: shipName },
												isShip: {
													assets: {
														logo: normalLogo,
													},
													category: "Cruiser",
													registry: "NCC-2016-A",
													shipClass: "Astra Cruiser",
												},
											},
											alertLevel,
										},
										player: {
											id: 481,
											name: shipName,
											registry: "",
											alertLevel: alertLevel,
											currentSystem: 310,
											systemPosition: {
												parentId: null,
												type: "interstellar",
												x: 0,
												y: 0,
												z: 0,
											},
											assets: {
												logo: normalLogo,
												model: "/plugins/Thorium Default/ships/Astra Frigate/assets/model.glb",
												vanity: "/plugins/Thorium Default/ships/Astra Frigate/assets/vanity.png",
												topView: "/plugins/Thorium Default/ships/Astra Frigate/assets/topView.png",
												sideView:
													"/plugins/Thorium Default/ships/Astra Frigate/assets/sideView.png",
											},
											isDestroyed: null,
										},
									} as any,
									station: {
										get: {
											name: previewViewscreen ? "Viewscreen" : stationName,
											logo: "",
											cards: previewViewscreen
												? [
														{
															icon: colorLogo,
															name: "Viewscreen",
															component: "ViewscreenDemo",
														},
													]
												: [
														{
															icon: colorLogo,
															name: "Component Demo",
															component: "ComponentDemo",
														},
														{
															icon: colorLogo,
															name: "Test Card",
															component: "Login",
														},
													],
										},
									} as any,
									theme: { get: null },
								}}
							>
								<StationData>
									<StationLayout />
								</StationData>
							</MockNetRequestContext.Provider>
						</div>
					</div>
					<Input
						label="Ship Name"
						labelHidden={false}
						value={shipName}
						onChange={(e) => setShipName(e.target.value)}
					/>
					<Input
						label="Station Name"
						labelHidden={false}
						value={stationName}
						onChange={(e) => setStationName(e.target.value)}
					/>
					<label className="block">
						Alert Level
						<select
							value={alertLevel}
							onChange={(e) => setAlertLevel(e.target.value)}
							className="select select-sm block w-32"
						>
							<option>5</option>
							<option>4</option>
							<option>3</option>
							<option>2</option>
							<option>1</option>
							<option>p</option>
						</select>
					</label>
					<AspectAssetUpload
						fileUrls={theme.assets.files}
						handleUpload={async (files) => {
							if (!files.length) return;
							const file = files[0];
							await q.plugin.theme.uploadFile.netSend({
								pluginId,
								themeId,
								file,
								fileName: file.name,
							});
						}}
						remove={async (file) => {
							await q.plugin.theme.removeFile.netSend({
								pluginId,
								themeId,
								file,
							});
						}}
					/>
				</div>
			</div>
			<Outlet />
		</>
	);
}
