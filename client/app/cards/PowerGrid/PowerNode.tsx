import type {AppRouter} from "@server/init/router";
import {inferTransformedProcedureOutput} from "@thorium/live-query/server/types";
import {capitalCase} from "change-case";
import {ReactNode, Suspense, useRef, useState} from "react";
import {
  useFloating,
  useInteractions,
  useClick,
  useDismiss,
} from "@floating-ui/react";
import Dropdown, {DropdownItem} from "@thorium/ui/Dropdown";
import {Menu, Portal} from "@headlessui/react";
import {q} from "@client/context/AppContext";
import {SystemSlider} from "./SystemSlider";
import Button from "@thorium/ui/Button";
import {Tooltip} from "@thorium/ui/Tooltip";
import {usePrompt} from "@thorium/ui/AlertDialog";
import useAnimationFrame from "@client/hooks/useAnimationFrame";
import {useLiveQuery} from "@thorium/live-query/client";
import {Icon} from "@thorium/ui/Icon";

type PowerNodeItem = inferTransformedProcedureOutput<
  AppRouter["powerGrid"]["powerNodes"]["get"]
>[0];

export function PowerNode({
  id,
  name,
  systemCount,
  distributionMode,
  children,
  setDragging,
}: PowerNodeItem & {
  children: ReactNode;
  setDragging: (system: {id: number; name?: string}, rect: DOMRect) => void;
}) {
  const inputRef = useRef<HTMLDivElement>(null);
  const inputMeter = useRef<HTMLMeterElement>(null);

  const {interpolate} = useLiveQuery();
  useAnimationFrame(() => {
    const entityValues = interpolate(id);
    if (!entityValues) return;
    const {x: powerInput, y: powerRequirement} = entityValues;
    const percent =
      powerRequirement === 0
        ? 1
        : Math.max(0, Math.min(1, powerInput / powerRequirement));

    if (inputRef.current) {
      inputRef.current.title = `Power Input: ${Math.round(
        percent * 100
      ).toFixed(0)}%`;
    }
    if (inputMeter.current) {
      inputMeter.current.value = percent;
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  const {x, y, strategy, refs, context} = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "left",
  });

  const dismiss = useDismiss(context);

  const click = useClick(context);

  const {getReferenceProps, getFloatingProps} = useInteractions([
    click,
    dismiss,
  ]);

  return (
    <>
      <div
        key={id}
        data-nodeid={id}
        className="relative p-4 flex items-center gap-4 panel panel-info text-5xl cursor-pointer hover:brightness-110 active:brightness-150"
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {children}
        <div
          ref={inputRef}
          className="h-full cursor-help"
          title={`Power Input: ${(0).toFixed(0)}%`}
        >
          <div className="min-h-full aspect-square -rotate-90 -ml-2 -mr-8 ">
            <meter
              ref={inputMeter}
              className="w-full h-4 absolute top-0"
              value={0}
              min={0}
              max={1}
            />
          </div>
        </div>
        <Icon name="git-pull-request-create" />
        <div className="flex flex-col select-none">
          <strong className="text-base font-bold">{capitalCase(name)}</strong>
          <span className="text-sm">{systemCount} Systems</span>
        </div>
      </div>
      {isOpen && (
        <Suspense fallback={null}>
          <Portal>
            <div
              ref={refs.setFloating}
              style={{
                position: strategy,
                top: y ?? 0,
                left: x ?? 0,
              }}
              className="theme-container z-50 text-white drop-shadow-xl bg-black/90 border-white/50 border-2 rounded px-2 py-1"
              {...getFloatingProps()}
            >
              <NodeDetails
                id={id}
                name={name}
                distributionMode={distributionMode}
                setDragging={(system, rect) => {
                  setIsOpen(false);
                  setDragging(system, rect);
                }}
              />
            </div>
          </Portal>
        </Suspense>
      )}
    </>
  );
}

function NodeDetails({
  id,
  name,
  distributionMode,
  setDragging,
}: {
  id: number;
  name: string;
  distributionMode: string;
  setDragging: (system: {id: number; name?: string}, rect: DOMRect) => void;
}) {
  const [systems] = q.powerGrid.powerNodes.systems.useNetRequest({nodeId: id});
  const prompt = usePrompt();
  if (!systems) return null;
  return (
    <>
      <div className="flex flex-col">
        <span className="font-semibold text-lg">
          {capitalCase(name)} Power Node
        </span>
        <div>
          <label className="flex gap-2 items-center">
            <div>Distribution Mode</div>
            <Dropdown
              triggerEl={
                <Menu.Button className="btn btn-warning btn-xs">
                  {capitalCase(distributionMode)} <Icon name="chevron-down" />
                </Menu.Button>
              }
            >
              <DropdownItem
                onClick={() =>
                  q.powerGrid.powerNodes.setDistributionMode.netSend({
                    nodeId: id,
                    distributionMode: "evenly",
                  })
                }
              >
                Evenly
              </DropdownItem>
              <DropdownItem
                onClick={() =>
                  q.powerGrid.powerNodes.setDistributionMode.netSend({
                    nodeId: id,
                    distributionMode: "mostFirst",
                  })
                }
              >
                Most Need First
              </DropdownItem>
              <DropdownItem
                onClick={() =>
                  q.powerGrid.powerNodes.setDistributionMode.netSend({
                    nodeId: id,
                    distributionMode: "leastFirst",
                  })
                }
              >
                Least Need First
              </DropdownItem>
            </Dropdown>
          </label>
        </div>
      </div>
      <ul className="flex flex-col gap-2 mt-4">
        {systems.map(system => (
          <li
            key={system.id}
            className="rounded border-white/50 border p-2 flex flex-col"
          >
            <div className="flex justify-between">
              <strong
                className="cursor-grab"
                onPointerDown={event =>
                  setDragging(
                    system,
                    event.currentTarget.getBoundingClientRect()
                  )
                }
              >
                {system.name}
              </strong>
              <Tooltip content="Override Power">
                <Button
                  className="btn-error btn-xs"
                  onClick={async event => {
                    event.preventDefault();
                    event.stopPropagation();
                    const override = await prompt({
                      header: "Override Power Safety Settings",
                      body: "Setting the power limit higher than 100% risks decreasing system efficiency and causing damage. Proceed with caution.",
                      defaultValue: "100%",
                      inputProps: {className: "input-error"},
                    });
                    if (typeof override === "string") {
                      const overrideAmount = Number(
                        override.replace("%", "").trim()
                      );
                      if (isNaN(overrideAmount)) return;
                      const overridePower =
                        (overrideAmount / 100) * system.maxSafePower;
                      q.powerGrid.powerNodes.setRequestedPower.netSend({
                        systemId: system.id,
                        nodeId: id,
                        requestedPower: overridePower,
                      });
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fillRule="evenodd"
                    strokeLinejoin="round"
                    strokeMiterlimit="2"
                    clipRule="evenodd"
                    viewBox="0 0 1000 1000"
                    height="100%"
                  >
                    <path
                      fillRule="nonzero"
                      d="M215.789 244.455a19.546 19.546 0 0119.544-19.544h.489a19.544 19.544 0 0119.545 19.544v.001A19.544 19.544 0 01235.822 264h-.489a19.547 19.547 0 01-13.82-5.724 19.547 19.547 0 01-5.724-13.82v-.001zM213.834 97.87v-4.886h43.487v4.886l-11.482 107.985h-20.522L213.834 97.87z"
                      transform="translate(-265.924 -302.316) scale(3.25126)"
                      fill="currentColor"
                    ></path>
                    <path
                      d="M662.266 113.628C813.026 177.077 919 326.26 919 500c0 231.252-187.748 419-419 419S81 731.252 81 500c0-173.74 105.974-322.923 256.734-386.372l9.726 91.464C240.894 260.361 168 371.735 168 500c0 183.236 148.764 332 332 332s332-148.764 332-332c0-128.265-72.894-239.639-179.46-294.908l9.726-91.464zm-19.281 181.325C707.658 340.153 750 415.171 750 500c0 137.979-112.021 250-250 250-137.979 0-250-112.021-250-250 0-84.829 42.342-159.847 107.015-205.047l11.09 104.289C346.712 427.196 334 462.125 334 500c0 91.618 74.382 166 166 166s166-74.382 166-166c0-37.875-12.712-72.804-34.105-100.758l11.09-104.289z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </Button>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 min-w-[250px]">
              {system.requestedPower <= system.maxSafePower * 1.25 ? (
                <SystemSlider
                  className="flex-1"
                  powerDraw={system.powerDraw}
                  maxOutput={system.maxSafePower * 1.25}
                  minValue={0}
                  maxValue={system.maxSafePower * 1.25}
                  value={system.requestedPower}
                  requiredPower={system.requiredPower}
                  defaultPower={system.defaultPower}
                  maxSafePower={system.maxSafePower}
                  step={0.1}
                  label="Power Limit"
                  onChange={value => {
                    if (typeof value === "number") {
                      q.powerGrid.powerNodes.setRequestedPower.netSend({
                        systemId: system.id,
                        nodeId: id,
                        requestedPower: value,
                      });
                    }
                  }}
                />
              ) : (
                <div className="flex flex-col">
                  <div className="text-red-500">
                    Power Override Engaged: {system.requestedPower}MW
                  </div>
                  <span>Current Power Draw: {system.powerDraw}MW</span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
