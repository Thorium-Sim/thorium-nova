import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { useConfirm } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { Icon } from "@thorium/ui/Icon";
import InfoTip from "@thorium/ui/InfoTip";
import Input from "@thorium/ui/Input";
import Select from "@thorium/ui/Select";
import TagInput from "@thorium/ui/TagInput";
import UploadWell from "@thorium/ui/UploadWell";
import { InventoryFlagValues } from "@thorium/utils/flags/InventoryFlags";
import { capitalCase } from "change-case";
import { useState } from "react";
import {
	Dialog,
	DialogTrigger,
	OverlayArrow,
	Popover,
	Button as RAButton,
} from "react-aria-components";
import { useParams, useNavigate, Navigate } from "react-router";

export default function InventoryLayout() {
	const { inventoryId, pluginId } = useParams() as {
		inventoryId: string;
		pluginId: string;
	};
	const navigate = useNavigate();
	const confirm = useConfirm();
	const [volumeError, setVolumeError] = useState(false);
	const [durabilityError, setDurabilityError] = useState(false);
	const [item] = q.plugin.inventory.get.useNetRequest({
		pluginId,
		inventoryId,
	});
	const [error, setError] = useState(false);

	if (!inventoryId || !item) return <Navigate to={`/config/${pluginId}/inventory`} />;

	return (
		<fieldset key={inventoryId} className="grid flex-1 grid-cols-2 overflow-y-auto">
			<div className="flex flex-wrap">
				<div className="flex-1 pr-4">
					<div className="flex items-end pb-4">
						<Input
							labelHidden={false}
							isInvalid={error}
							invalidMessage="Name is required"
							label="Name"
							placeholder="Ale Glass"
							defaultValue={item.name}
							onChange={() => setError(false)}
							onBlur={async (e: any) => {
								if (!e.target.value) return setError(true);
								try {
									const result = await q.plugin.inventory.update.netSend({
										pluginId,
										inventoryId,
										name: e.target.value,
									});
									void navigate(`/config/${pluginId}/inventory/${result.inventoryId}`);
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error renaming inventory item",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
					</div>
					<div className="flex pb-4">
						<Input
							labelHidden={false}
							label="Plural"
							defaultValue={item.plural}
							onBlur={(e: any) =>
								q.plugin.inventory.update.netSend({
									pluginId,
									inventoryId,
									plural: e.target.value,
								})
							}
						/>
					</div>
					<div className="flex pb-4">
						<Input
							as="textarea"
							className="!h-32"
							labelHidden={false}
							label="Description"
							defaultValue={item.description}
							onBlur={(e: any) =>
								q.plugin.inventory.update.netSend({
									pluginId,
									inventoryId,
									description: e.target.value,
								})
							}
						/>
					</div>
					<div className="flex items-end pb-4">
						<div className="flex-1">
							<TagInput
								label="Tags"
								tags={item.tags}
								onAdd={(tag) => {
									if (item.tags.includes(tag)) return;
									void q.plugin.inventory.update.netSend({
										pluginId,
										inventoryId,
										tags: [...item.tags, tag],
									});
								}}
								onRemove={(tag) => {
									if (!item.tags.includes(tag)) return;
									void q.plugin.inventory.update.netSend({
										pluginId,
										inventoryId,
										tags: item.tags.filter((t) => t !== tag),
									});
								}}
							/>
						</div>
					</div>
					<div className="pb-4">
						<Input
							labelHidden={false}
							isInvalid={volumeError}
							invalidMessage="Volume must be a number greater than 0"
							label={<span>Volume in liters</span>}
							defaultValue={item.volume}
							onFocus={() => setVolumeError(false)}
							onChange={() => setVolumeError(false)}
							onBlur={(e: any) => {
								if (
									Number.isNaN(Number.parseFloat(e.target.value)) ||
									Number.parseFloat(e.target.value) <= 0
								)
									return setVolumeError(true);
								void q.plugin.inventory.update.netSend({
									pluginId,
									inventoryId,
									volume: Number(e.target.value),
								});
							}}
						/>
						<small>The amount of space this item takes up in a cargo container or room.</small>
					</div>
					<div className="pb-4">
						<Checkbox
							label="Continuous"
							helperText="If unchecked, this is a discrete item, like a probe casing. When checked, this item can be continuously consumed, like fuel."
							onChange={(e) => {
								void q.plugin.inventory.update.netSend({
									pluginId,
									inventoryId,
									continuous: e.target.checked,
								});
							}}
							defaultChecked={item.continuous}
						/>
					</div>
					<div className="pb-4">
						<Input
							labelHidden={false}
							isInvalid={durabilityError}
							invalidMessage="Durability must be between 0 and 1"
							label={<span>Durability</span>}
							defaultValue={item.durability}
							onFocus={() => setDurabilityError(false)}
							onChange={() => setDurabilityError(false)}
							onBlur={(e: any) => {
								if (
									Number.isNaN(Number.parseFloat(e.target.value)) ||
									Number.parseFloat(e.target.value) < 0 ||
									Number.parseFloat(e.target.value) > 1
								)
									return setDurabilityError(true);
								void q.plugin.inventory.update.netSend({
									pluginId,
									inventoryId,
									durability: Number(e.target.value),
								});
							}}
						/>
						<small>
							Probability the item will not be consumed when used. 1 means it lasts forever; 0 means
							it will always be consumed when used.
						</small>
					</div>
				</div>
			</div>
			<div className="max-w-sm">
				<div className="max-w-max">
					<label htmlFor="inventory-image">Image</label>
					<UploadWell
						id="inventory-image"
						accept="image/*"
						onChange={async (files) => {
							await q.plugin.inventory.update.netSend({
								pluginId,
								inventoryId,
								image: files[0],
							});
						}}
					>
						{item.assets.image && (
							<img
								src={`${item.assets.image}?${Date.now()}`}
								alt="Inventory Item"
								className="h-10/12 w-10/12 object-cover"
							/>
						)}
					</UploadWell>
					<p>
						<small>Image should be square and at least 512px wide.</small>
					</p>
				</div>
				<span>Inventory Type</span>
				{Object.entries(InventoryFlagValues).map(([key, value]) => {
					const defaultValue = key in item.flags;
					const flagKey = key as keyof typeof InventoryFlagValues;
					return (
						<div key={key} className="flex items-center gap-1">
							<Checkbox
								key={key}
								name="flags"
								defaultChecked={defaultValue}
								onChange={(e) => {
									void q.plugin.inventory.update.netSend({
										pluginId,
										inventoryId,
										flags: {
											...item.flags,
											[key]: e.target.checked ? {} : undefined,
										},
									});
								}}
								label={capitalCase(key)}
							/>
							{defaultValue && Object.keys(value).filter((t) => t !== "info").length > 0 ? (
								<DialogTrigger>
									<RAButton
										aria-label="Configure Flag"
										className="btn btn-xs btn-warning btn-outline"
									>
										<Icon name="pencil" />
									</RAButton>
									<Popover className={popoverTransitionClasses}>
										<OverlayArrow>
											<svg width={12} height={12} viewBox="0 0 12 12">
												<path d="M0 0 L6 6 L12 0" />
											</svg>
										</OverlayArrow>
										<Dialog className="w-max max-w-lg rounded border border-white/50 bg-black/90 p-2 text-white">
											{Object.entries(value).map(([config, value]) => {
												if (config === "info") return null;
												function updateValue(value: any) {
													void q.plugin.inventory.update.netSend({
														pluginId,
														inventoryId,
														flags: {
															...item?.flags,
															[key]: {
																...item?.flags[flagKey],
																[config]: value,
															},
														},
													});
												}
												if (typeof value.defaultValue === "number")
													return (
														<Input
															key={config}
															label={capitalCase(config)}
															type="text"
															inputMode="numeric"
															pattern="[0-9]*"
															defaultValue={
																// @ts-expect-error Pain to type these literal keys
																item.flags[flagKey]?.[config] ?? value.defaultValue
															}
															helperText={value.info}
															onChange={(e) => {
																if (Number.isNaN(Number(e.target.value))) return;
																updateValue(Number(e.target.value));
															}}
														/>
													);
												if (Array.isArray(value.options)) {
													const items: { id: string; label: string }[] = value.options.map(
														(o: string) => ({
															id: o,
															label: capitalCase(o),
														}),
													);
													return (
														<Select
															key={config}
															label={capitalCase(config)}
															items={items}
															selected={
																// @ts-expect-error Pain to type these literal keys
																item.flags[flagKey]?.[config] || null
															}
															setSelected={(value) => {
																if (Array.isArray(value)) return;
																updateValue(value.id);
															}}
														/>
													);
												}
												if (typeof value.defaultValue === "string")
													return (
														<Input
															key={config}
															label={capitalCase(config)}
															type="text"
															defaultValue={
																// @ts-expect-error Pain to type these literal keys
																item.flags[flagKey]?.[config] ?? value.defaultValue
															}
															helperText={value.info}
															onChange={(e) => {
																updateValue(e.target.value);
															}}
														/>
													);
												return null;
											})}
										</Dialog>
									</Popover>
								</DialogTrigger>
							) : null}
							<InfoTip>{value.info}</InfoTip>
						</div>
					);
				})}
			</div>
			<div>
				<Button
					className="btn-outline btn-error btn-sm w-full"
					disabled={!inventoryId}
					onClick={async () => {
						if (
							!inventoryId ||
							!(await confirm({
								header: "Are you sure you want to delete this inventory item?",
								body: "All content for this item, including images and other assets, will be gone forever.",
							}))
						)
							return;
						await q.plugin.inventory.update.netSend({
							pluginId,
							inventoryId,
						});
						await navigate(`/config/${pluginId}/inventory`);
					}}
				>
					Delete Inventory Item
				</Button>
				{/* <Button
                        className="w-full btn-outline btn-notice"
                        disabled={true}
                        onClick={async () => {
                          if (!pluginId) return;
                          const name = await prompt({
                            header: "What is the name of the duplicated plugin?",
                          });
                          if (!name || typeof name !== "string") return;
                          const result = await netSend("pluginShipDuplicate", {
                            pluginId: pluginId,
                            shipId
                            name,
                          });
                          if ("error" in result) {
                            toast({title:"Error duplicating plugin", body: result.error, color:"error"});
                            return;
                          }
                          navigate(`/config/${result.shipId}`);
                        }}
                      >
                        Duplicate Ship
                      </Button> */}
			</div>
		</fieldset>
	);
}
