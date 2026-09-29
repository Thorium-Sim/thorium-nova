import { q } from "@thorium/context/AppContext";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import { Transition } from "@thorium/ui/Transition";
import { cn } from "@thorium/utils/cn";
import uniqid from "@thorium/utils/uniqid";
import { type ReactNode, useEffect, useReducer, useRef, useState } from "react";
import { createPortal } from "react-dom";

// TODO September 25, 2025 - Replace this with React Aria Components
const Toast = ({
	title,
	body = null,
	color,
	dismiss,
	visible,
	actions,
	pause,
	resume,
}: Notification & {
	dismiss: () => void;
}) => {
	let action: NotificationAction | undefined = undefined;
	if (actions?.length === 1 && !actions[0].label) {
		action = actions[0];
	}
	const labelledActions = actions?.filter((a) => a.label);
	return (
		<Transition
			isOpen={visible}
			className={cn(
				`toast alert absolute right-0 m-4 block! min-h-16 w-md max-w-xs`,
				"entering:opacity-0 exiting:opacity-0 exiting:pointer-events-none transition-all duration-500 data-entered:opacity-100! data-exited:hidden",
				{
					"cursor-pointer": !!action,
					"pointer-events-none": !action,
					"alert-success": color === "success",
					"alert-warning": color === "warning",
					"alert-error": color === "error",
					"alert-info": color === "info",
					"alert-notice": color === "notice",
				},
			)}
			onClick={() => {
				if (action) {
					q.thorium.executeBlocks.netSend(action);
					dismiss();
				}
			}}
			onMouseEnter={() => pause()}
			onMouseLeave={() => resume()}
			afterLeave={() => dismiss()}
		>
			<div className="flex w-full items-center justify-between">
				<h5 className="text-xl font-bold whitespace-pre-wrap">{title}</h5>
				{!labelledActions || labelledActions.length === 0 ? (
					<button
						className="close pointer-events-auto ml-2 rounded-full p-1 transition-colors hover:bg-white/30"
						aria-label="close"
						onClick={() => dismiss()}
					>
						<Icon name="x" />
					</button>
				) : null}
			</div>
			<p className="whitespace-pre-wrap">{body}</p>
			{labelledActions && labelledActions.length > 0 ? (
				<div className="mt-2 flex w-full items-center justify-end gap-2">
					{labelledActions.map((action) => (
						<Button
							className={cn("btn-sm pointer-events-auto", {
								"btn-success": color === "success",
								"btn-warning": color === "warning",
								"btn-error": color === "error",
								"btn-info": color === "info",
								"btn-notice": color === "notice",
							})}
							onClick={() => {
								q.thorium.executeBlocks.netSend(action);
								dismiss();
							}}
						>
							{action.label}
						</Button>
					))}
				</div>
			) : null}
		</Transition>
	);
};
interface NotificationAction {
	label?: string | undefined;
	blocks: any[];
	localVariables?: any;
}

interface Notification {
	id: string;
	title: string;
	body?: ReactNode;
	visible: boolean;
	duration?: number;
	actions?: NotificationAction[];
	color?: "info" | "success" | "warning" | "error" | "notice";
	pause: () => void;
	resume: () => void;
}

function toastReducer(state: Notification[], action: Notification | string) {
	if (typeof action === "string") {
		const item = state.find((item) => item.id === action);
		if (!item?.visible) {
			return state.filter((notification) => notification.id !== action);
		}
		return state.map((notification) => {
			if (notification.id === action) {
				return { ...notification, visible: false };
			}
			return notification;
		});
	}
	return [...state, action];
}
export let toast: (
	notification: Omit<Notification, "id" | "visible" | "pause" | "resume">,
) => void = () => {};

export default function ToastContainer() {
	const [toasts, dispatch] = useReducer(toastReducer, []);
	const toastsRef = useRef(toasts);
	toastsRef.current = toasts;

	useEffect(() => {
		const timeouts: Record<string, ReturnType<typeof setTimeout>> = {};
		toast = (notification: Omit<Notification, "id" | "visible" | "pause" | "resume">) => {
			if (toastsRef.current.some((t) => t.visible && t.title === notification.title)) {
				return;
			}

			const id = uniqid("tst-");
			const { duration = 5000 } = notification;
			dispatch({
				...notification,
				id,
				visible: true,
				pause: () => clearTimeout(timeouts[id]),
				resume: () => setTimeout(() => dispatch(id), duration),
			});
			// If there are any labelled actions, don't run the timeout
			const labelledActions = notification.actions?.filter((a) => a.label);
			if (!labelledActions || labelledActions.length === 0) {
				timeouts[id] = setTimeout(() => {
					dispatch(id);
					delete timeouts[id];
					timeouts[uniqid()] = setTimeout(() => dispatch(id), 1000);
				}, duration);
			}
		};

		return () => {
			for (const timeout in timeouts) {
				clearTimeout(timeouts[timeout]);
			}
		};
	}, []);

	const [portalRef, setPortalRef] = useState<HTMLDivElement | null>(null);
	useEffect(() => {
		if (!portalRef) {
			const div = document.createElement("div");
			div.className = "toast-container theme-container";
			document.body.appendChild(div);
			setPortalRef(div);
		}
	}, [portalRef]);
	if (!portalRef) {
		return null;
	}
	return createPortal(
		<div className="fixed top-0 right-0 z-20">
			{toasts.map((toast) => (
				<Toast key={toast.id} {...toast} dismiss={() => dispatch(toast.id)} />
			))}
		</div>,
		portalRef,
	);
}
