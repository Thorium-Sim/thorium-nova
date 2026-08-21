import { useAlert, useConfirm, usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import { InputField, OutputField, TypingField } from "@thorium/ui/Core";
import Dropdown, { DropdownItem } from "@thorium/ui/Dropdown";
import { Icon } from "@thorium/ui/Icon";
import InfoTip from "@thorium/ui/InfoTip";
import LinearDotIndicator from "@thorium/ui/LinearDotIndicator";
import { LoadingSpinner } from "@thorium/ui/LoadingSpinner";
import { Menu, MenuItem, MenuTrigger } from "@thorium/ui/Menu";
import Modal from "@thorium/ui/Modal";
import RadialDial from "@thorium/ui/RadialDial";
import SearchableInput, { DefaultResultLabel } from "@thorium/ui/SearchableInput";
import SearchableList from "@thorium/ui/SearchableList";
import Select from "@thorium/ui/Select";
import SineWave from "@thorium/ui/SineWave";
import TagInput from "@thorium/ui/TagInput";
import { useTransition } from "@thorium/ui/Transition";
import { cn } from "@thorium/utils/cn";
import { type ReactNode, useRef, useState } from "react";
import { Button as RAButton, type Selection } from "react-aria-components";
const ModalDemo = ({ title, children }: { title: string; children: ReactNode }) => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<div>
			<Button className="btn btn-primary" onClick={() => setIsOpen(true)}>
				Open Modal
			</Button>
			<Modal isOpen={isOpen} setIsOpen={setIsOpen} title={title}>
				{children}
			</Modal>
		</div>
	);
};

const SearchableListDemo = () => {
	const [selected, setSelected] = useState<null | number>(null);
	return (
		<div className="w-56">
			<SearchableList
				items={[
					{
						id: 1,
						label: "Item 1",
						category: "Category 1",
					},
					{
						id: 2,
						label: "Item 2",
						category: "Category 2",
					},
					{
						id: 3,
						label: "Item 3",
						category: "Category 1",
					},
					{
						id: 4,
						label: "Item 4",
						category: "Category 1",
					},
					{
						id: 5,
						label: "Item 5",
						category: "Category 2",
					},
				]}
				selectedItem={selected}
				setSelectedItem={({ id }) => {
					setSelected(id);
				}}
			/>
		</div>
	);
};

const TagInputDemo = () => {
	const [tags, setTags] = useState(["Tag 1"]);
	return (
		<TagInput
			label="Tag Input"
			tags={tags}
			onAdd={(t) => setTags((tags) => tags.concat(t))}
			onRemove={(t) => setTags((tags) => tags.filter((tt) => tt !== t))}
		/>
	);
};

async function searchableInputQuery({ queryKey }: { queryKey: [string, string] }) {
	await new Promise((res) => setTimeout(res, 1000 + Math.random() * 500));
	const [_, query] = queryKey;
	const people = [
		{ id: 1, name: "Wade Cooper" },
		{ id: 2, name: "Arlene Mccoy" },
		{ id: 3, name: "Devon Webb" },
		{ id: 4, name: "Tom Cook" },
		{ id: 5, name: "Tanya Fox" },
		{ id: 6, name: "Hellen Schmidt" },
	];

	const filteredPeople =
		query === ""
			? people
			: people.filter((person) =>
					person.name
						.toLowerCase()
						.replace(/\s+/g, "")
						.includes(query.toLowerCase().replace(/\s+/g, "")),
				);

	return filteredPeople;
}

export function ComponentDemo() {
	const [selected, setSelected] = useState<null | { id: number; name: string }>(null);

	const ref = useRef<HTMLDivElement>(null);
	const [isOpen, setIsOpen] = useState(false);
	const transitionState = useTransition(ref, isOpen);

	const alert = useAlert();
	const prompt = usePrompt();
	const confirm = useConfirm();

	const lineRef = useRef(0);

	const [menuSelected, setMenuSelected] = useState<Selection>(new Set(["rulers"]));

	return (
		<div className="flex h-full flex-col gap-8 overflow-y-auto p-4">
			<MenuTrigger>
				<RAButton className="btn w-min whitespace-nowrap">Open Menu</RAButton>
				<Menu
					selectionMode="multiple"
					selectedKeys={menuSelected}
					onSelectionChange={setMenuSelected}
				>
					<MenuItem id="grid">Pixel grid</MenuItem>
					<MenuItem id="rulers">Rulers</MenuItem>
					<MenuItem id="comments" isDisabled>
						Comments
					</MenuItem>
					<MenuItem id="layout">Layout guides</MenuItem>
					<MenuItem id="toolbar">Toolbar</MenuItem>
				</Menu>
			</MenuTrigger>
			<div className="flex gap-4">
				<div className="bg-accent text-accent-content cursor-default rounded px-4 py-2">
					cursor-default
				</div>
				<div className="bg-accent text-accent-content cursor-pointer rounded px-4 py-2">
					cursor-pointer
				</div>
				<div className="bg-accent text-accent-content cursor-text rounded px-4 py-2">
					cursor-text
				</div>
				<div className="bg-accent text-accent-content cursor-progress rounded px-4 py-2">
					cursor-progress{" "}
				</div>
				<div className="bg-accent text-accent-content cursor-not-allowed rounded px-4 py-2">
					cursor-not-allowed
				</div>
				<div className="bg-accent text-accent-content cursor-wait rounded px-4 py-2">
					cursor-wait
				</div>
			</div>
			<div className="flex gap-4">
				<Button onClick={() => alert({ header: "This is an alert" })}>Alert</Button>
				<Button
					onClick={() =>
						prompt({
							header: "What do you want to write?",
							body: "You can write anything you like.",
						})
					}
				>
					Prompt
				</Button>
				<Button onClick={() => confirm({ header: "Yes or no?", body: "Choose carefully." })}>
					Confirm
				</Button>
			</div>
			<Button onClick={() => setIsOpen((o) => !o)}>Toggle</Button>
			<div
				ref={ref}
				className={cn(
					"transition-all w-8 h-8 rounded bg-pink-500 opacity-0 duration-1000 scale-100 rotate-0",
					{
						"opacity-100": isOpen,
						"scale-150": transitionState === "entering",
						"rotate-90": transitionState === "exiting",
					},
				)}
			/>
			<div className="flex flex-col gap-4">
				<h2 className="text-3xl">Alert</h2>
				<div className="alert">
					<div className="flex-1">This is a normal alert</div>
				</div>
				<div className="alert alert-info">
					<div className="flex-1">This is an info alert</div>
				</div>
				<div className="alert alert-success">
					<div className="flex-1">This is a success alert</div>
				</div>
				<div className="alert alert-warning">
					<div className="flex-1">This is a warning alert</div>
				</div>
				<div className="alert alert-error">
					<div className="flex-1">This is an error alert</div>
				</div>
				<div className="alert alert-notice">
					<div className="flex-1">This is a notice alert</div>
				</div>
				<div className="alert alert-alert">
					<div className="flex-1">This is a alert alert</div>
				</div>
			</div>
			<div>
				<h2 className="text-3xl">Searchable Input</h2>
				<SearchableInput
					key="demo"
					selected={selected}
					setSelected={(val) => {
						setSelected(val);
					}}
					getOptions={searchableInputQuery}
					displayValue={(result) => result?.name}
					ResultLabel={({ result, active, selected }) => (
						<DefaultResultLabel active={active} selected={selected}>
							{result.name}
						</DefaultResultLabel>
					)}
				/>
			</div>
			<div>
				<h2 className="text-3xl">Badges</h2>
				<div className="flex gap-4">
					<div className="badge">neutral</div>
					<div className="badge badge-primary">primary</div>
					<div className="badge badge-secondary">secondary</div>
					<div className="badge badge-accent">accent</div>
					<div className="badge badge-ghost">ghost</div>
					<div className="badge badge-info">info</div>
					<div className="badge badge-success">success</div>
					<div className="badge badge-warning">warning</div>
					<div className="badge badge-error">error</div>
				</div>
			</div>
			<div>
				<h2 className="text-3xl">Buttons</h2>
				<div className="flex w-full flex-wrap gap-4">
					<Button>Button</Button>
					<Button className="btn-primary">Primary</Button>
					<Button className="btn-secondary">Secondary</Button>
					<Button className="btn-accent">Accent</Button>
					<Button className="btn-info">Info</Button>
					<Button className="btn-success">Success</Button>
					<Button className="btn-warning">Warning</Button>
					<Button className="btn-error">Error</Button>
					<Button className="btn-notice">Notice</Button>
					<Button className="btn-alert">Alert</Button>
					<Button className="btn-link">Link</Button>
				</div>
				<div className="flex w-full flex-wrap gap-4">
					<Button className="btn-active">Button</Button>
					<Button className="btn-active btn-primary">Primary</Button>
					<Button className="btn-active btn-secondary">Secondary</Button>
					<Button className="btn-active btn-accent">Accent</Button>
					<Button className="btn-active btn-info">Info</Button>
					<Button className="btn-active btn-success">Success</Button>
					<Button className="btn-active btn-warning">Warning</Button>
					<Button className="btn-active btn-error">Error</Button>
					<Button className="btn-active btn-notice">Notice</Button>
					<Button className="btn-active btn-alert">Alert</Button>
					<Button className="btn-active btn-link">Link</Button>
				</div>
				<div className="flex w-full flex-wrap gap-4">
					<Button disabled>Button</Button>
					<Button disabled className="btn-primary">
						Primary
					</Button>
					<Button disabled className="btn-secondary">
						Secondary
					</Button>
					<Button disabled className="btn-accent">
						Accent
					</Button>
					<Button disabled className="btn-info">
						Info
					</Button>
					<Button disabled className="btn-success">
						Success
					</Button>
					<Button disabled className="btn-warning">
						Warning
					</Button>
					<Button disabled className="btn-error">
						Error
					</Button>
					<Button disabled className="btn-notice">
						Notice
					</Button>
					<Button disabled className="btn-alert">
						Alert
					</Button>
					<Button disabled className="btn-link">
						Link
					</Button>
				</div>
			</div>
			<div>
				<h2 className="text-3xl">Outline Buttons</h2>
				<div className="flex w-full flex-wrap gap-4">
					<Button className="btn-outline">Button</Button>
					<Button className="btn-outline btn-primary">Primary</Button>
					<Button className="btn-outline btn-secondary">Secondary</Button>
					<Button className="btn-outline btn-accent">Accent</Button>
					<Button className="btn-outline btn-info">Info</Button>
					<Button className="btn-outline btn-success">Success</Button>
					<Button className="btn-outline btn-warning">Warning</Button>
					<Button className="btn-outline btn-error">Error</Button>
					<Button className="btn-outline btn-notice">Notice</Button>
					<Button className="btn-outline btn-alert">Alert</Button>
					<Button className="btn-outline btn-link">Link</Button>
				</div>
			</div>
			<div>
				<h2 className="text-3xl">Dash Buttons</h2>
				<div className="flex w-full flex-wrap gap-4">
					<Button className="btn-dash">Button</Button>
					<Button className="btn-dash btn-primary">Primary</Button>
					<Button className="btn-dash btn-secondary">Secondary</Button>
					<Button className="btn-dash btn-accent">Accent</Button>
					<Button className="btn-dash btn-info">Info</Button>
					<Button className="btn-dash btn-success">Success</Button>
					<Button className="btn-dash btn-warning">Warning</Button>
					<Button className="btn-dash btn-error">Error</Button>
					<Button className="btn-dash btn-notice">Notice</Button>
					<Button className="btn-dash btn-alert">Alert</Button>
					<Button className="btn-dash btn-link">Link</Button>
				</div>
			</div>
			<div>
				<h2 className="text-3xl">Button Sizes</h2>
				<div className="flex gap-4">
					<Button className="btn-lg">Large</Button>
					<Button className="btn-md">Normal</Button>
					<Button className="btn-sm">Small</Button>
					<Button className="btn-xs">Tiny</Button>
				</div>
			</div>
			<div>
				<h2 className="text-3xl">Button Groups</h2>
				<div className="join">
					<Button className="btn-active">Item 1</Button>
					<Button>Item 2</Button>
					<Button>Item 3</Button>
				</div>
			</div>
			<div>
				<h2 className="text-3xl">Gamepad Focus Border</h2>
				<Button className="btn-active gamepad-focus">I am focused</Button>
			</div>
			<div className="w-full">
				<h2 className="text-3xl">Form Input</h2>
				<div className="flex flex-wrap gap-4">
					<div className="form-control">
						<label className="label" htmlFor="Input">
							Input
						</label>
						<input type="text" className="input" id="Input" />
					</div>
					<div className="form-control">
						<label className="label" htmlFor="Primary">
							Primary
						</label>
						<input type="text" className="input input-primary" id="Primary" />
					</div>
					<div className="form-control">
						<label className="label" htmlFor="Secondary">
							Secondary
						</label>
						<input type="text" className="input input-secondary" id="Secondary" />
					</div>
					<div className="form-control">
						<label className="label" htmlFor="Accent">
							Accent
						</label>
						<input type="text" className="input input-accent" id="Accent" />
					</div>
					<div className="form-control">
						<label className="label" htmlFor="Info">
							Info
						</label>
						<input type="text" className="input input-info" id="Info" />
					</div>
					<div className="form-control">
						<label className="label" htmlFor="Success">
							Success
						</label>
						<input type="text" className="input input-success" id="Success" />
					</div>
					<div className="form-control">
						<label className="label" htmlFor="Warning">
							Warning
						</label>
						<input type="text" className="input input-warning" id="Warning" />
					</div>
					<div className="form-control">
						<label className="label" htmlFor="Error">
							Error
						</label>
						<input type="text" className="input input-error" id="Error" />
					</div>
					<div className="form-control">
						<label className="label" htmlFor="Notice">
							Notice
						</label>
						<input type="text" className="input input-notice" id="Notice" />
					</div>
				</div>
			</div>
			<div>
				<h2 className="text-3xl">Form Textarea</h2>
				<div className="flex flex-wrap gap-4">
					<div className="form-control">
						<label className="label" htmlFor="textarea-Textarea">
							Textarea
						</label>
						<textarea className="textarea" id="textarea-Textarea" />
					</div>
					<div className="form-control">
						<label className="label" htmlFor="textarea-Primary">
							Primary
						</label>
						<textarea className="textarea textarea-primary" id="textarea-Primary" />
					</div>
					<div className="form-control">
						<label className="label" htmlFor="textarea-Secondary">
							Secondary
						</label>
						<textarea className="textarea textarea-secondary" id="textarea-Secondary" />
					</div>
					<div className="form-control">
						<label className="label" htmlFor="textarea-Accent">
							Accent
						</label>
						<textarea className="textarea textarea-accent" id="textarea-Accent" />
					</div>
					<div className="form-control">
						<label className="label" htmlFor="textarea-Info">
							Info
						</label>
						<textarea className="textarea textarea-info" id="textarea-Info" />
					</div>
					<div className="form-control">
						<label className="label" htmlFor="textarea-Success">
							Success
						</label>
						<textarea className="textarea textarea-success" id="textarea-Success" />
					</div>
					<div className="form-control">
						<label className="label" htmlFor="textarea-Warning">
							Warning
						</label>
						<textarea className="textarea textarea-warning" id="textarea-Warning" />
					</div>
					<div className="form-control">
						<label className="label" htmlFor="textarea-Error">
							Error
						</label>
						<textarea className="textarea textarea-error" id="textarea-Error" />
					</div>
					<div className="form-control">
						<label className="label" htmlFor="textarea-Notice">
							Notice
						</label>
						<textarea className="textarea textarea-notice" id="textarea-Notice" />
					</div>
				</div>
			</div>
			<div>
				<h2 className="text-3xl">Checkbox</h2>
				<Checkbox label="Checkbox" />
			</div>

			<div>
				<h2 className="text-3xl">Panels</h2>
				<div className="flex gap-4">
					<div className="panel h-32 w-64 p-4">Panel</div>
					<div className="panel panel-ghost h-32 w-64 p-4">Panel</div>
					<div className="panel panel-primary h-32 w-64 p-4">Panel</div>
					<div className="panel panel-secondary h-32 w-64 p-4">Panel</div>
					<div className="panel panel-accent h-32 w-64 p-4">Panel</div>
					<div className="panel panel-info h-32 w-64 p-4">Panel</div>
					<div className="panel panel-success h-32 w-64 p-4">Panel</div>
					<div className="panel panel-warning h-32 w-64 p-4">Panel</div>
					<div className="panel panel-error h-32 w-64 p-4">Panel</div>
					<div className="panel panel-notice h-32 w-64 p-4">Panel</div>
					<div className="panel panel-alert h-32 w-64 p-4">Panel</div>
				</div>
			</div>
			<div>
				<h2 className="text-3xl">Colored Bar</h2>
				<progress className="progress progress-accent" value={50} max={100} />
				<progress className="progress progress-primary" value={50} max={100} />
				<progress className="progress progress-secondary" value={50} max={100} />
				<progress className="progress progress-accent" value={50} max={100} />
				<progress className="progress progress-info" value={50} max={100} />
				<progress className="progress progress-success" value={50} max={100} />
				<progress className="progress progress-warning" value={50} max={100} />
				<progress className="progress progress-error" value={50} max={100} />
				<progress className="progress progress-notice" value={50} max={100} />
				<progress className="progress progress-alert" value={50} max={100} />
			</div>
			<div>
				<h2 className="text-3xl">Radial Dial</h2>
				<div className="flex gap-4">
					<RadialDial label="Dial 1" count={50} />
					<RadialDial label="Dial 2" color="var(--primary)" count={75} />
					<RadialDial label="Dial 3" color="var(--accent)" count={75} max={200} />
				</div>
			</div>
			<div>
				<h2 className="text-3xl">Search Field with Results Dropdown</h2>
				<SearchableListDemo />
			</div>
			<div>
				<h2 className="text-3xl">Vertical Dragging Power Bar</h2>
			</div>
			<div>
				<h2 className="text-3xl">Range Slider</h2>
				<input type="range" className="range max-w-sm" />
				<input type="range" className="range range-primary max-w-sm" />
				<input type="range" className="range range-secondary max-w-sm" />
				<input type="range" className="range range-accent max-w-sm" />
				<input type="range" className="range range-info max-w-sm" />
				<input type="range" className="range range-success max-w-sm" />
				<input type="range" className="range range-warning max-w-sm" />
				<input type="range" className="range range-error max-w-sm" />
				<input type="range" className="range range-notice max-w-sm" />
			</div>
			<div>
				<h2 className="text-3xl">Modal</h2>
				<ModalDemo title="Modal Test">
					This is a test of the modal. Lets see how well it works.
				</ModalDemo>
			</div>
			<div>
				<h2 className="text-3xl">Tag Input</h2>
				<TagInputDemo />
			</div>
			<div>
				<h2 className="text-3xl">Draggable Arrow</h2>
			</div>
			<div>
				<h2 className="text-3xl">Sine Wave</h2>
				<div className="flex flex-wrap">
					<div className="h-48 w-[250px] bg-gray-800">
						<SineWave
							waves={[
								{
									amplitude: 0.25,
									frequency: 50,
									phase: Math.PI / 2,
								},
							]}
							callFrame={(ctx, width, height) => {
								if (lineRef.current > width) {
									lineRef.current = 0;
								}
								ctx.fillStyle = "rgba(255,255,0,0.5)";
								ctx.fillRect(lineRef.current - 1, 0, 4, height);
								lineRef.current += 1;
							}}
						/>
					</div>
					<div className="h-[250px] w-48 bg-gray-800">
						<SineWave
							color="blue"
							waves={[
								{
									amplitude: 0.25,
									frequency: 24,
									phase: Math.PI / 2,
								},
								{
									amplitude: 0.25,
									frequency: 12,
									phase: Math.PI / 2,
								},
								{
									amplitude: 0.125,
									frequency: 6,
									phase: Math.PI / 2,
								},
								{
									amplitude: 0.25,
									frequency: 3,
									phase: Math.PI / 2,
								},
							]}
							orientation="vertical"
						/>
					</div>
				</div>
			</div>
			<div>
				<h2 className="text-3xl">Dropdown</h2>
				<Dropdown triggerLabel="Open Me" origin="origin-center">
					<DropdownItem>Item 1</DropdownItem>
					<DropdownItem>Item 2</DropdownItem>
					<DropdownItem>Item 3</DropdownItem>
					<DropdownItem>Item 4</DropdownItem>
					<DropdownItem>Item 5</DropdownItem>
				</Dropdown>
				<Dropdown
					triggerEl={
						<RAButton className="btn btn-primary">
							Open Me <Icon name="chevron-down" />
						</RAButton>
					}
				>
					<DropdownItem>Item 1</DropdownItem>
					<DropdownItem>Item 2</DropdownItem>
					<DropdownItem>Item 3</DropdownItem>
					<DropdownItem>Item 4</DropdownItem>
					<DropdownItem>Item 5</DropdownItem>
					<DropdownItem>Item 1</DropdownItem>
					<DropdownItem>Item 2</DropdownItem>
					<DropdownItem>Item 3</DropdownItem>
					<DropdownItem>Item 4</DropdownItem>
					<DropdownItem>Item 5</DropdownItem>
				</Dropdown>
			</div>
			<div>
				<h2 className="text-3xl">Select</h2>
				<Select
					id="select"
					label="Select"
					items={[
						{ id: 1, label: "Test" },
						{ id: 2, label: "Another Test" },
						{ id: 3, label: "A third test" },
						{ id: 4, label: "Test" },
						{ id: 5, label: "Another Test" },
						{ id: 6, label: "A third test" },
						{ id: 7, label: "Test" },
						{ id: 8, label: "Another Test" },
						{ id: 9, label: "A third test" },
					]}
					selected={null}
					setSelected={() => {}}
				/>
			</div>
			<div>
				<h2 className="text-3xl">Fading Scroll Area</h2>
				<div className="faded-scroll-x">
					{Array(20)
						.fill(0)
						.map((_, i) => (
							<div
								key={`item-${i}`}
								className="bg-neutral mx-4 flex h-32 w-32 items-center justify-center rounded"
							>
								Item {i}
							</div>
						))}
				</div>
			</div>
			<div>
				<h2 className="text-3xl">Info Tooltip</h2>
				<InfoTip>
					This is some helpful info that you can see if you hover your cursor over me or focus on
					me.
				</InfoTip>
			</div>
			<div>
				<h2 className="text-3xl">Dotted Linear Indicators</h2>
				<div className="mt-4 flex max-w-md flex-col gap-4">
					<LinearDotIndicator />
					<LinearDotIndicator reverse={true} />
					<LinearDotIndicator color="blue" level={0.5} />
					<LinearDotIndicator color="red" level={0.25} dotCount={30} />
				</div>
			</div>
			<div>
				<h2 className="text-3xl">Core Inputs</h2>
				<div className="w-sm text-xs">
					<InputField onClick={() => {}} prompt="Testing">
						Testing
					</InputField>
					<OutputField>Testing</OutputField>
					<TypingField value={"Testing"} />
				</div>
			</div>
			<div>
				<h2 className="text-3xl">Loading Spinner</h2>
				<LoadingSpinner compact />
			</div>
		</div>
	);
}
