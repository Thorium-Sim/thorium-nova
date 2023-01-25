import {create} from "zustand";
import {persist} from "zustand/middleware";
import {produce} from "immer";
import {
  Dispatch,
  Fragment,
  ReactNode,
  SetStateAction,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Modal from "@thorium/ui/Modal";
import Select from "@thorium/ui/Select";
import {capitalCase} from "change-case";
import Button from "@thorium/ui/Button";
import {FaBan, FaPencilAlt} from "react-icons/fa";
import {autoPlacement, useFloating} from "@floating-ui/react-dom";
import useOnClickOutside from "./useClickOutside";
import Checkbox from "@thorium/ui/Checkbox";
import Input from "@thorium/ui/Input";
const gamepadKeys = [
  "yaw",
  "pitch",
  "roll",
  "x-thrusters",
  "y-thrusters",
  "z-thrusters",
  "zoom-adjust",
  "zoom-set",
  "pilot-sensor-tilt",
  "autopilot-lock-on",
  "autopilot-activate",
  "full-stop",
  "impulse-speed",
  "impulse-adjust",
  "warp-focus-set",
  "warp-focus-adjust",
  "warp-engage",
] as const;

export type GamepadKey = (typeof gamepadKeys)[number];
const keyLabels: Partial<Record<GamepadKey, string>> = {
  "zoom-adjust": "Hold down a button to adjust zoom. Use with two buttons.",
  "zoom-set": "Set the current zoom to the value of an axis.",
  "pilot-sensor-tilt": "Press a button to toggle the sensor tilt.",
  "impulse-speed": "Set the current speed to the value of an axis.",
  "impulse-adjust": "Hold down a button to adjust speed. Use with two buttons.",
  "warp-focus-set":
    "Use an axis to shift focus between the warp speed buttons.",
  "warp-focus-adjust":
    "Use two buttons to shift focus between the warp speed buttons.",
  "warp-engage": "Activate the currently focused warp speed.",
};

type GamepadActionConfig = (
  | {
      control: "axis";
      invert?: boolean;
      deadZone?: number;
    }
  | {
      control: "button";
      /** Multiply the button output so it can be used like a joystick */
      multiplier?: number;
      invert?: boolean;
    }
  | {
      control: "hat";
      axis: "x" | "y";
    }
) & {
  /** Gamepad ID */
  gamepad: string;
  index: number;
};
interface JoystickConfig {
  name: string;
  actions: {[K in GamepadKey]?: GamepadActionConfig[]};
}

export const useGamepadStore = create<{gamepads: (Gamepad | null)[]}>(
  (set, get) => ({
    gamepads: [],
  })
);

export const useGamepadConfigStore = create(
  persist<{
    configs: JoystickConfig[];
    activeConfig: number;
    createConfig: (name: string) => void;
    renameConfig: (name: string) => void;
    deleteConfig: () => void;
    addAction: (key: GamepadKey, action: GamepadActionConfig) => void;
    removeAction: (key: GamepadKey, gamepad: string) => void;
    updateAction: (
      key: GamepadKey,
      action: Partial<GamepadActionConfig> & {gamepad: string; index: number}
    ) => void;
  }>(
    (set, get) => ({
      configs: [
        {
          name: "Default",
          actions: {},
        },
      ],
      activeConfig: 0,
      createConfig: (name: string) => {
        set(
          produce(get(), draft => {
            draft.configs.push({name, actions: {}});
          })
        );
      },
      renameConfig: (name: string) => {
        set(
          produce(get(), draft => {
            draft.configs[get().activeConfig].name = name;
          })
        );
      },
      deleteConfig: () => {
        set(
          produce(get(), draft => {
            draft.configs.splice(get().activeConfig, 1);
          })
        );
      },
      addAction: (key: GamepadKey, action: GamepadActionConfig) => {
        if (
          get().configs[get().activeConfig].actions[key]?.some(
            a =>
              a.gamepad === action.gamepad &&
              a.control === action.control &&
              a.index === action.index
          )
        )
          return;
        set(
          produce(get(), draft => {
            draft.configs[get().activeConfig].actions[key] =
              draft.configs[get().activeConfig].actions[key] || [];
            draft.configs[get().activeConfig].actions[key]?.push(action);
          })
        );
      },
      removeAction: (key: GamepadKey, gamepad: string) => {
        set(
          produce(get(), draft => {
            draft.configs[get().activeConfig].actions[key] =
              draft.configs[get().activeConfig].actions[key] || [];
            const actionIndex =
              draft.configs[get().activeConfig].actions[key]?.findIndex(
                item => item.gamepad === gamepad
              ) || -1;
            draft.configs[get().activeConfig].actions[key]?.splice(
              actionIndex,
              1
            );
          })
        );
      },
      updateAction: (
        key: GamepadKey,
        action: Partial<GamepadActionConfig> & {gamepad: string; index: number}
      ) => {
        set(
          produce(get(), draft => {
            draft.configs[get().activeConfig].actions[key] =
              draft.configs[get().activeConfig].actions[key] || [];
            const actionIndex =
              get().configs[get().activeConfig].actions[key]?.findIndex(
                item =>
                  item.gamepad === action.gamepad && item.index === action.index
              ) ?? -1;
            if (actionIndex === -1) return;
            try {
              for (let item in action) {
                // @ts-expect-error Immer weirdness
                draft.configs[get().activeConfig].actions[key][actionIndex][
                  item
                  // @ts-expect-error Immer weirdness
                ] = action[item];
              }
            } catch {}
          })
        );
      },
    }),
    {
      name: "gamepad-store",
      version: 5,
      // @ts-expect-error Seems like poor typing
      partialize: state => ({
        configs: state.configs,
        activeConfig: state.activeConfig,
      }),
    }
  )
);
let gamepadTimestamps: number[] = [];

function updateGamepadStore() {
  const gamepads = navigator.getGamepads();
  let shouldUpdate = false;
  for (let [index, gamepad] of gamepads.entries()) {
    if (!gamepad) continue;
    if (gamepad.timestamp !== gamepadTimestamps[index]) {
      gamepadTimestamps[index] = gamepad.timestamp;
      shouldUpdate = true;
    }
  }
  if (shouldUpdate) {
    useGamepadStore.setState({
      gamepads: navigator.getGamepads(),
    });
  }
  requestAnimationFrame(updateGamepadStore);
}
requestAnimationFrame(updateGamepadStore);

function calculateHatDirection(input: number) {
  let x = 0;
  let y = 0;
  if (input === -1 || input === -0.71429 || input === 1) {
    y = 1;
  }
  if (input === -0.71429 || input === -0.42857 || input === -0.14286) {
    x = 1;
  }
  if (input === -0.14286 || input === 0.14286 || input === 0.42857) {
    y = -1;
  }
  if (input === 0.42857 || input === 0.71429 || input === 1) {
    x = -1;
  }
  if (x && y) {
    // If it's at an angle, we should
    // normalize each dimension to the unit circle
    x *= Math.cos(Math.PI / 4);
    y *= Math.sin(Math.PI / 4);
  }
  return {x, y};
}

function objectDiff(
  o1: ({axes: number[]; buttons: number[]} | null)[],
  o2: ({axes: number[]; buttons: number[]} | null)[]
) {
  let diffs: {path: string; old: number; newVal: number}[] = [];
  for (let [key, value] of o1.entries()) {
    if (value === o2[key] && value === null) continue;
    for (let [axis, axisValue] of value?.axes.entries() || []) {
      if (axisValue !== o2[key]?.axes[axis])
        diffs.push({
          path: `${key}.axes.${axis}`,
          old: o2[key]?.axes[axis] || 0,
          newVal: axisValue,
        });
    }
    for (let [button, buttonValue] of value?.buttons.entries() || []) {
      if (buttonValue !== o2[key]?.buttons[button])
        diffs.push({
          path: `${key}.buttons.${button}`,
          old: o2[key]?.buttons[button] || 0,
          newVal: buttonValue,
        });
    }
  }

  return diffs;
}

function parseGamepads(gamepads: (Gamepad | null)[]) {
  return gamepads.map(gamepad =>
    gamepad
      ? {
          id: gamepad.id,
          axes: gamepad.axes.concat(),
          buttons: gamepad.buttons.map(button => button.value),
        }
      : null
  );
}

export function useGamepadValue(
  key: GamepadKey | undefined,
  callback: (val: number) => void
): void {
  // First check all the gamepads in the current config
  // to see if any of them have a value for this key.
  const config = useGamepadConfigStore(
    store => store.configs[store.activeConfig]
  );
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const oldValue = useRef(0);
  const actions = config?.actions[key || ("" as GamepadKey)];
  useEffect(() => {
    if (!actions) return;
    const unsubscribe = useGamepadStore.subscribe(store => {
      let value = 0;
      for (let action of actions) {
        let actionValue = 0;
        const gamepad = store.gamepads.find(
          gamepad => gamepad && action.gamepad === gamepad.id
        );
        switch (action.control) {
          case "axis": {
            let {index, deadZone = 0.05, invert} = action;
            actionValue = gamepad?.axes[index] || 0;
            if (deadZone < 0 || deadZone >= 1) deadZone = 0;
            if (deadZone !== 0) {
              actionValue =
                actionValue < deadZone && actionValue > deadZone * -1
                  ? 0
                  : actionValue;
            }
            if (invert) {
              actionValue *= -1;
            }
            break;
          }
          case "button": {
            let {index, invert, multiplier = 1} = action;
            actionValue = gamepad?.buttons[index].value || 0;
            if (invert) {
              actionValue = 1 - actionValue;
            }
            actionValue *= multiplier;

            break;
          }
          case "hat": {
            let {index, axis} = action;
            actionValue = gamepad?.axes[index] || 0;
            const direction = calculateHatDirection(actionValue);
            actionValue = direction[axis];
          }
        }
        value += actionValue;
      }

      if (value !== oldValue.current) {
        oldValue.current = value;
        callbackRef.current(value);
      }
    });

    return () => unsubscribe();
  }, [actions, key]);
}

export function useGamepadPress(
  key: GamepadKey | undefined,
  callbacks: {onDown?: (val: number) => void; onUp?: (val: number) => void}
) {
  const lastVal = useRef(0);
  useGamepadValue(key, value => {
    if (Math.abs(value) > 0.5) {
      callbacks.onDown?.(value);
    } else if (Math.abs(lastVal.current) > 0.5) {
      callbacks.onUp?.(lastVal.current);
    }
    lastVal.current = value;
  });
}

export function GamepadConfig({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: () => void;
}) {
  const gamepads = useGamepadStore(store =>
    store.gamepads.map(gamepad => gamepad?.id).filter(filterNull)
  );
  const [gamepad, setGamepad] = useState<{
    id: string | number;
    label: string;
  } | null>({id: gamepads[0], label: gamepads[0]});
  const [assigningKey, setAssigningKey] = useState<GamepadKey | null>(null);

  useEffect(() => {
    if (!gamepad && !assigningKey) return;
    let old = parseGamepads(useGamepadStore.getState().gamepads);
    const unsub = useGamepadStore.subscribe(store => {
      const newVal = parseGamepads(store.gamepads);
      if (old.length === 0 && newVal.length > 0) {
        old = newVal;
        return;
      }
      const diff = objectDiff(newVal, old);
      for (let {path, old, newVal} of diff) {
        const [diffGamepad, type, index] = path.split(".") as [
          string,
          "axes" | "buttons",
          string
        ];
        const gamepadObj =
          useGamepadStore.getState().gamepads[Number(diffGamepad)];
        if (!gamepadObj) continue;
        if (!assigningKey) continue;
        if (gamepad?.id !== gamepadObj.id) continue;
        // Make sure the axis is actually being adjusted
        if (Math.abs(newVal) > 0.5) {
          const config: GamepadActionConfig = {
            index: Number(index),
            gamepad: gamepadObj.id,
            ...(type === "axes" ? {control: "axis"} : {control: "button"}),
          };
          useGamepadConfigStore.getState().addAction(assigningKey, config);
          setAssigningKey(null);
          break;
        }
      }
    });

    return () => unsub();
  }, [assigningKey, gamepad]);
  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Gamepad Config">
      <div className="mt-4">
        <Select
          label="Gamepad"
          items={gamepads.map(g => ({id: g, label: g}))}
          selected={gamepad}
          setSelected={val => {
            setGamepad(val);
            setAssigningKey(null);
          }}
        ></Select>
        <small>Connect your gamepad and press a button to recognize it.</small>
        <form className="divide-y divide-gray-800">
          {gamepadKeys.map(key => (
            <GamepadAction
              key={key}
              width={Math.max(...gamepadKeys.map(key => key.length))}
              keyData={key}
              gamepad={gamepad?.id as string}
              assigningKey={assigningKey}
              setAssigningKey={setAssigningKey}
            />
          ))}
        </form>
      </div>
    </Modal>
  );
}

function GamepadAction({
  keyData: key,
  gamepad,
  assigningKey,
  setAssigningKey,
  width,
}: {
  keyData: GamepadKey;
  gamepad: string | undefined;
  assigningKey: GamepadKey | null;
  setAssigningKey: Dispatch<SetStateAction<GamepadKey | null>>;
  width: number;
}) {
  const keyConfigs =
    useGamepadConfigStore(store =>
      store.configs[store.activeConfig].actions[key]?.filter(
        action => action.gamepad === gamepad
      )
    ) || [];

  return (
    <div className="flex gap-2 items-center justify-between py-4">
      <div style={{width: `${width}ch`}}>
        {capitalCase(key)}
        <small className="block text-gray-400">{keyLabels[key]}</small>
      </div>

      <ul className="flex-1">
        {keyConfigs.map(keyConfig => (
          <li
            key={`${keyConfig.gamepad}-${keyConfig.control}-${keyConfig.index}`}
          >
            {capitalCase(keyConfig.control)}: {keyConfig.index}{" "}
            <button
              className="px-1 py-2"
              type="button"
              onClick={() =>
                gamepad &&
                useGamepadConfigStore.getState().removeAction(key, gamepad)
              }
            >
              <FaBan className="text-red-500" />
            </button>
            <ActionConfig>
              {keyConfig.control === "axis" ? (
                <div>
                  <Checkbox
                    label="Invert"
                    checked={!!keyConfig.invert}
                    onChange={evt =>
                      gamepad &&
                      useGamepadConfigStore.getState().updateAction(key, {
                        invert: evt.target.checked,
                        index: keyConfig.index,
                        gamepad,
                      })
                    }
                  />{" "}
                  <Input
                    label="Dead Zone"
                    helperText="Reduce jitter by ignoring axis inputs below this number"
                    placeholder="0.05"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    defaultValue={keyConfig.deadZone}
                    onChange={evt =>
                      !isNaN(Number(evt.target.value)) &&
                      gamepad &&
                      useGamepadConfigStore.getState().updateAction(key, {
                        deadZone: Number(evt.target.value),
                        index: keyConfig.index,
                        gamepad,
                      })
                    }
                  />
                </div>
              ) : keyConfig.control === "button" ? (
                <div>
                  <Checkbox
                    label="Invert"
                    checked={!!keyConfig.invert}
                    onChange={evt =>
                      gamepad &&
                      useGamepadConfigStore.getState().updateAction(key, {
                        invert: evt.target.checked,
                        index: keyConfig.index,
                        gamepad,
                      })
                    }
                  />
                  <Input
                    label="Multiplier"
                    helperText="Multiply the button output so it can be used like a joystick"
                    placeholder="1"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    defaultValue={keyConfig.multiplier}
                    onChange={evt =>
                      !isNaN(Number(evt.target.value)) &&
                      gamepad &&
                      useGamepadConfigStore.getState().updateAction(key, {
                        multiplier: Number(evt.target.value),
                        index: keyConfig.index,
                        gamepad,
                      })
                    }
                  />
                </div>
              ) : null}
            </ActionConfig>
          </li>
        ))}
      </ul>
      <Button
        disabled={!gamepad}
        type="button"
        className={`btn-xs place-self-end self-center max-w-fit ${
          assigningKey !== key ? "btn-warning" : ""
        }`}
        onClick={() => setAssigningKey(assigningKey ? null : key)}
      >
        {assigningKey === key ? "Use Button or Joystick" : "Assign"}
      </Button>
    </div>
  );
}

function ActionConfig({children}: {children: ReactNode}) {
  const {x, y, reference, floating, strategy, refs, update} = useFloating({
    placement: "right",
    middleware: [autoPlacement()],
  });
  const [visible, setVisible] = useState(false);
  useLayoutEffect(() => {
    if (visible) {
      update();
    }
  }, [update, visible]);
  useOnClickOutside(refs.floating as React.MutableRefObject<HTMLElement>, () =>
    setVisible(false)
  );

  return (
    <>
      <button
        className="px-1 py-2"
        type="button"
        ref={reference}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          setVisible(v => !v);
        }}
      >
        <FaPencilAlt className="text-primary" />
      </button>
      <div
        ref={floating}
        style={{
          position: strategy,
          top: y ?? "",
          left: x ?? "",
        }}
        className={`max-w-xs w-max z-10 border-transparent shadow-lg bg-opacity-90 bg-black rounded-lg p-2 ${
          visible ? "block" : "hidden"
        }`}
      >
        {children}
      </div>
    </>
  );
}

function filterNull<T>(val: T | null | undefined): val is T {
  return !!val;
}
