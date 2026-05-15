import { useMutation, useQuery } from "@tanstack/react-query";
import { useThoriumAccount } from "@thorium/context/ThoriumAccountContext";
import { toast } from "@thorium/context/ToastContext";
import { useConfirm, usePrompt } from "@thorium/ui/AlertDialog";
import Dropdown, { DropdownItem } from "@thorium/ui/Dropdown";
import { Icon } from "@thorium/ui/Icon";
import { Model } from "@thorium/utils/FlexLayout";
import { useContext, useState } from "react";
import { Button } from "react-aria-components";

import { CoreFlexLayoutContext, defaultJson } from "./CoreFlexLayoutContext";

export function CoreFlexLayoutDropdown() {
	const { layoutModel, setLayoutModel } = useContext(CoreFlexLayoutContext);
	const { account } = useThoriumAccount();
	const [selectedLayout, setSelectedLayout] = useState<number | null>(null);

	const coreLayoutQuery = useQuery({
		queryKey: ["coreLayout", account?.user_id],
		queryFn: () => {
			return fetch(`${process.env.THORIUMSIM_URL}/api/coreLayouts`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${account?.access_token}`,
				},
			}).then((res) => res.json()) as Promise<{
				coreLayouts: {
					id: number;
					name: string;
					layout_json: string;
				}[];
			}>;
		},
		enabled: account?.user_id !== undefined,
	});

	const coreLayoutMutation = useMutation({
		mutationFn: ({ method, body }: { method: "POST" | "PUT" | "DELETE"; body: any }) => {
			return fetch(`${process.env.THORIUMSIM_URL}/api/coreLayouts`, {
				method,
				body: JSON.stringify(body),
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${account?.access_token}`,
				},
			}).then((res) => res.json()) as Promise<{ coreLayout: { id: number } }>;
		},
		onSettled: () => {
			coreLayoutQuery.refetch();
		},
	});

	const prompt = usePrompt();
	const confirm = useConfirm();

	if (coreLayoutQuery.isLoading && coreLayoutQuery.fetchStatus === "idle") {
		return null;
	}

	return (
		<Dropdown
			triggerEl={
				<Button className="btn btn-xs btn-outline btn-warning">
					<span>
						{coreLayoutQuery.isLoading ? "Loading Flex Layouts..." : "Change Flex Layout"}
					</span>
					<Icon name="chevron-down" className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
				</Button>
			}
		>
			<DropdownItem
				onClick={() => {
					setSelectedLayout(null);
					setLayoutModel(Model.fromJson(defaultJson));
				}}
				className="btn-sm py-1"
				inactiveClass="btn-ghost"
				activeClass="btn-warning text-white"
			>
				Clear Flex Layout
			</DropdownItem>
			<hr />
			{coreLayoutQuery.data?.coreLayouts.map((c) => (
				<DropdownItem
					key={c.id}
					onClick={() => {
						setSelectedLayout(c.id);
						setLayoutModel(Model.fromJson(JSON.parse(c.layout_json)));
					}}
					className="btn-sm flex py-1"
					inactiveClass="btn-ghost"
					activeClass="btn-warning text-white"
				>
					<div className="flex-1">{c.name}</div>
					{selectedLayout === c.id && <Icon name="check" />}
				</DropdownItem>
			))}
			<hr />
			<DropdownItem
				onClick={async () => {
					const model = layoutModel.toJson();
					if (!model) return;
					const name = await prompt({
						header: "Enter a name for this new core layout",
					});
					if (!name) return;
					coreLayoutMutation.mutate(
						{
							method: "POST",
							body: {
								name,
								layout_json: JSON.stringify(model),
							},
						},
						{
							onSuccess: (data) => {
								setSelectedLayout(data.coreLayout.id);
								toast({ title: "Core Layout Saved", color: "success" });
							},
							onError: () => {
								toast({ title: "Core Layout Save Failed", color: "error" });
							},
						},
					);
				}}
				className="btn-sm py-1"
				inactiveClass="btn-ghost"
				activeClass="btn-warning text-white"
			>
				Save New Layout
			</DropdownItem>
			{selectedLayout && (
				<>
					<hr />
					<DropdownItem
						className="btn-sm py-1"
						inactiveClass="btn-ghost"
						activeClass="btn-warning text-white"
						onClick={async () => {
							const model = layoutModel.toJson();
							if (!model) return;
							coreLayoutMutation.mutate(
								{
									method: "PUT",
									body: {
										layout_json: JSON.stringify(model),
										id: selectedLayout,
									},
								},
								{
									onSuccess: () => {
										toast({ title: "Core Layout Saved", color: "success" });
									},
									onError: () => {
										toast({ title: "Core Layout Save Failed", color: "error" });
									},
								},
							);
						}}
					>
						Save Layout
					</DropdownItem>
					<DropdownItem
						onClick={async () => {
							const layout = coreLayoutQuery.data?.coreLayouts.find((l) => l.id === selectedLayout);
							const name = await prompt({
								header: "Enter a new name for this new core layout",
								defaultValue: layout?.name,
							});
							if (!name) return;
							coreLayoutMutation.mutate(
								{
									method: "PUT",
									body: {
										name,
										id: selectedLayout,
									},
								},
								{
									onSuccess: () => {
										toast({ title: "Core Layout Saved", color: "success" });
									},
									onError: () => {
										toast({ title: "Core Layout Save Failed", color: "error" });
									},
								},
							);
						}}
						className="btn-sm py-1"
						inactiveClass="btn-ghost"
						activeClass="btn-warning text-white"
					>
						Rename Layout
					</DropdownItem>
					<DropdownItem
						className="btn-sm py-1"
						inactiveClass="btn-ghost"
						activeClass="btn-warning text-white"
						onClick={async () => {
							if (
								!(await confirm({
									header: "Are you sure you want to delete this layout?",
								}))
							)
								return;
							coreLayoutMutation.mutate(
								{
									method: "DELETE",
									body: {
										id: selectedLayout,
									},
								},
								{
									onSuccess: () => {
										toast({ title: "Core Layout Deleted", color: "success" });
										setSelectedLayout(null);
									},
									onError: () => {
										toast({
											title: "Core Layout Deletion Failed",
											color: "error",
										});
									},
								},
							);
						}}
					>
						Delete Layout
					</DropdownItem>
				</>
			)}
		</Dropdown>
	);
}
