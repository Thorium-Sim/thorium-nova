import {Menu} from "@headlessui/react";
import Dropdown, {DropdownItem} from "@thorium/ui/Dropdown";
import LinearDotIndicator from "@thorium/ui/LinearDotIndicator";
import RadialDial from "@thorium/ui/RadialDial";
import Select from "@thorium/ui/Select";
import SineWave from "@thorium/ui/SineWave";
import Modal from "@thorium/ui/Modal";
import {ReactNode, useState} from "react";
import {HiChevronDown} from "react-icons/hi";
import SearchableList from "@thorium/ui/SearchableList";
import InfoTip from "@thorium/ui/InfoTip";
import TagInput from "@thorium/ui/TagInput";
import Button from "@thorium/ui/Button";
import SearchableInput, {DefaultResultLabel} from "@thorium/ui/SearchableInput";
import {QueryFunctionContext} from "@tanstack/react-query";

const ModalDemo = ({title, children}: {title: string; children: ReactNode}) => {
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
        setSelectedItem={id => {
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
      onAdd={t => setTags(tags => tags.concat(t))}
      onRemove={t => setTags(tags => tags.filter(tt => tt !== t))}
    />
  );
};

async function searchableInputQuery({
  queryKey,
}: QueryFunctionContext<[string, string]>) {
  await new Promise(res => setTimeout(res, 1000 + Math.random() * 500));
  const [key, query] = queryKey;
  const people = [
    {id: 1, name: "Wade Cooper"},
    {id: 2, name: "Arlene Mccoy"},
    {id: 3, name: "Devon Webb"},
    {id: 4, name: "Tom Cook"},
    {id: 5, name: "Tanya Fox"},
    {id: 6, name: "Hellen Schmidt"},
  ];

  const filteredPeople =
    query === ""
      ? people
      : people.filter(person =>
          person.name
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(query.toLowerCase().replace(/\s+/g, ""))
        );

  return filteredPeople;
}

export default function ComponentDemo() {
  const [selected, setSelected] = useState<null | {id: number; name: string}>(
    null
  );
  return (
    <div className="flex flex-col gap-8 text-white h-full overflow-y-auto">
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl">Alert</h2>
        <div className="alert">
          <div className="flex-1">
            <label>This is a normal alert</label>
          </div>
        </div>
        <div className="alert alert-info">
          <div className="flex-1">
            <label>This is an info alert</label>
          </div>
        </div>
        <div className="alert alert-success">
          <div className="flex-1">
            <label>This is a success alert</label>
          </div>
        </div>
        <div className="alert alert-warning">
          <div className="flex-1">
            <label>This is a warning alert</label>
          </div>
        </div>
        <div className="alert alert-error">
          <div className="flex-1">
            <label>This is an error alert</label>
          </div>
        </div>
        <div className="alert alert-notice">
          <div className="flex-1">
            <label>This is an alert alert</label>
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-3xl">Searchable Input</h2>
        <SearchableInput
          key="demo"
          selected={selected}
          setSelected={val => {
            setSelected(val);
            console.log(val);
          }}
          getOptions={searchableInputQuery}
          displayValue={result => result?.name}
          ResultLabel={({result, active, selected}) => (
            <DefaultResultLabel
              name={result.name}
              active={active}
              selected={selected}
            />
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
        <div className="flex gap-4 w-full flex-wrap">
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
          <Button className="btn-ghost">Ghost</Button>
          <Button className="btn-link">Link</Button>
          <Button className="glass">Glass</Button>
        </div>
      </div>
      <div>
        <h2 className="text-3xl">Outline Buttons</h2>
        <div className="flex gap-4 w-full flex-wrap">
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
          <Button className="btn-outline btn-ghost">Ghost</Button>
          <Button className="btn-outline btn-link">Link</Button>
          <Button className="btn-outline glass">Glass</Button>
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
        <div className="btn-group">
          <Button className="btn-active">Item 1</Button>
          <Button>Item 2</Button>
          <Button>Item 3</Button>
        </div>
      </div>
      <div>
        <h2 className="text-3xl">Divider</h2>
        <div className="flex flex-col w-full">
          <div className="grid h-20 card bg-neutral rounded-box place-items-center">
            content
          </div>
          <div className="divider">OR</div>
          <div className="grid h-20 card bg-neutral rounded-box place-items-center">
            content
          </div>
        </div>
      </div>
      <div className="w-full">
        <h2 className="text-3xl">Form Input</h2>
        <div className="flex gap-4 flex-wrap">
          <div className="form-control">
            <label className="label">Input</label>
            <input type="text" className="input"></input>
          </div>
          <div className="form-control">
            <label className="label">Primary</label>
            <input type="text" className="input input-primary"></input>
          </div>
          <div className="form-control">
            <label className="label">Secondary</label>
            <input type="text" className="input input-secondary"></input>
          </div>
          <div className="form-control">
            <label className="label">Accent</label>
            <input type="text" className="input input-accent"></input>
          </div>
          <div className="form-control">
            <label className="label">Info</label>
            <input type="text" className="input input-info"></input>
          </div>
          <div className="form-control">
            <label className="label">Success</label>
            <input type="text" className="input input-success"></input>
          </div>
          <div className="form-control">
            <label className="label">Warning</label>
            <input type="text" className="input input-warning"></input>
          </div>
          <div className="form-control">
            <label className="label">Error</label>
            <input type="text" className="input input-error"></input>
          </div>
          <div className="form-control">
            <label className="label">Notice</label>
            <input type="text" className="input input-notice"></input>
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-3xl">Form Textarea</h2>
        <div className="flex gap-4 flex-wrap">
          <div className="form-control">
            <label className="label">Textarea</label>
            <textarea className="textarea"></textarea>
          </div>
          <div className="form-control">
            <label className="label">Primary</label>
            <textarea className="textarea textarea-primary"></textarea>
          </div>
          <div className="form-control">
            <label className="label">Secondary</label>
            <textarea className="textarea textarea-secondary"></textarea>
          </div>
          <div className="form-control">
            <label className="label">Accent</label>
            <textarea className="textarea textarea-accent"></textarea>
          </div>
          <div className="form-control">
            <label className="label">Info</label>
            <textarea className="textarea textarea-info"></textarea>
          </div>
          <div className="form-control">
            <label className="label">Success</label>
            <textarea className="textarea textarea-success"></textarea>
          </div>
          <div className="form-control">
            <label className="label">Warning</label>
            <textarea className="textarea textarea-warning"></textarea>
          </div>
          <div className="form-control">
            <label className="label">Error</label>
            <textarea className="textarea textarea-error"></textarea>
          </div>
          <div className="form-control">
            <label className="label">Notice</label>
            <textarea className="textarea textarea-notice"></textarea>
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-3xl">Readonly Field</h2>
      </div>
      <div>
        <h2 className="text-3xl">Panel</h2>
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
        <h2 className="text-3xl">Keypad</h2>
      </div>
      <div>
        <h2 className="text-3xl">Colored Bar</h2>
        <progress className="progress progress-accent" value={50} max={100} />
        <progress className="progress progress-primary" value={50} max={100} />
        <progress
          className="progress progress-secondary"
          value={50}
          max={100}
        />
        <progress className="progress progress-accent" value={50} max={100} />
        <progress className="progress progress-info" value={50} max={100} />
        <progress className="progress progress-success" value={50} max={100} />
        <progress className="progress progress-warning" value={50} max={100} />
        <progress className="progress progress-error" value={50} max={100} />
        <progress className="progress progress-notice" value={50} max={100} />
        <progress className="progress progress-alert" value={50} max={100} />
      </div>
      <div>
        <h2 className="text-3xl">Scrollable List</h2>
      </div>
      <div>
        <h2 className="text-3xl">Table</h2>
      </div>
      <div>
        <h2 className="text-3xl">Joystick</h2>
      </div>
      <div>
        <h2 className="text-3xl">Radial Dial</h2>
        <div className="flex gap-4">
          <RadialDial label="Dial 1" count={50} />
          <RadialDial label="Dial 2" color="var(--primary)" count={75} />
          <RadialDial
            label="Dial 3"
            color="var(--accent)"
            count={75}
            max={200}
          />
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
        <input type="range" className="slider max-w-sm" />
        <input type="range" className="slider slider-primary max-w-sm" />
        <input type="range" className="slider slider-secondary max-w-sm" />
        <input type="range" className="slider slider-accent max-w-sm" />
        <input type="range" className="slider slider-info max-w-sm" />
        <input type="range" className="slider slider-success max-w-sm" />
        <input type="range" className="slider slider-warning max-w-sm" />
        <input type="range" className="slider slider-error max-w-sm" />
        <input type="range" className="slider slider-notice max-w-sm" />
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
          <div className="w-[250px] h-48 bg-gray-800">
            <SineWave />
          </div>
          <div className="w-48 h-[250px] bg-gray-800">
            <SineWave
              color="blue"
              frequency={2}
              orientation="vertical"
            ></SineWave>
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
            <Menu.Button className="btn btn-primary">
              Open Me <HiChevronDown />
            </Menu.Button>
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
          label="Select"
          items={[
            {id: 1, label: "Test"},
            {id: 2, label: "Another Test"},
            {id: 3, label: "A third test"},
            {id: 4, label: "Test"},
            {id: 5, label: "Another Test"},
            {id: 6, label: "A third test"},
            {id: 7, label: "Test"},
            {id: 8, label: "Another Test"},
            {id: 9, label: "A third test"},
          ]}
          selected={{id: 1, label: "Test"}}
          setSelected={() => {}}
        ></Select>
      </div>
      <div>
        <h2 className="text-3xl">Fading Scroll Area</h2>
        <div className="faded-scroll-x">
          {Array(20)
            .fill(0)
            .map((_, i) => (
              <div
                key={`item-${i}`}
                className="h-32 w-32 rounded mx-4 bg-neutral flex justify-center items-center"
              >
                Item {i}
              </div>
            ))}
        </div>
      </div>
      <div>
        <h2 className="text-3xl">Info Tooltip</h2>
        <InfoTip>
          This is some helpful info that you can see if you hover your cursor
          over me or focus on me.
        </InfoTip>
      </div>
      <div>
        <h2 className="text-3xl">Dotted Linear Indicators</h2>
        <div className="flex flex-col gap-4 max-w-md mt-4">
          <LinearDotIndicator />
          <LinearDotIndicator reverse={true} />
          <LinearDotIndicator color="blue" level={0.5} />
          <LinearDotIndicator color="red" level={0.25} dotCount={30} />
        </div>
      </div>
    </div>
  );
}
