import {ReactNode, useEffect, useReducer, useRef, useState} from "react";
import * as React from "react";
import {FaTimes} from "react-icons/fa";
import uniqid from "@thorium/uniqid";
import {Transition} from "@headlessui/react";
import {createPortal} from "react-dom";
const Toast = ({
  title,
  body = null,
  color,
  dismiss,
  visible,
  action,
  pause,
  resume,
}: Notification & {
  dismiss: () => void;
}) => {
  return (
    <Transition
      as="div"
      appear={true}
      show={visible}
      enter="transition-all duration-500"
      enterFrom="opacity-0 max-h-0"
      enterTo="opacity-100 max-h-[10rem]"
      leave="transition-all duration-250"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className={`toast alert ${
          color === "success"
            ? "alert-success"
            : color === "warning"
            ? "alert-warning"
            : color === "error"
            ? "alert-error"
            : color === "info"
            ? "alert-info"
            : color === "notice"
            ? "alert-notice"
            : ""
        } !block m-4 min-h-16 max-w-md ${
          action ? "cursor-pointer" : "pointer-events-none"
        }`}
        onClick={() => {
          action?.();
          dismiss();
        }}
        onMouseEnter={() => pause()}
        onMouseLeave={() => resume()}
      >
        <div className="w-full flex items-center justify-between">
          <h5 className="font-bold text-xl whitespace-pre-wrap">{title}</h5>
          <button
            className="close p-1 rounded-full hover:bg-white/30 transition-colors pointer-events-auto ml-2"
            aria-label="close"
            onClick={() => dismiss()}
          >
            <FaTimes />
          </button>
        </div>
        <p className="whitespace-pre-wrap">{body}</p>
      </div>
    </Transition>
  );
};
interface Notification {
  id: string;
  title: string;
  body?: ReactNode;
  visible: boolean;
  duration?: number;
  action?: () => any;
  color?: "info" | "success" | "warning" | "error" | "notice";
  pause: () => void;
  resume: () => void;
}

function toastReducer(state: Notification[], action: Notification | string) {
  if (typeof action === "string") {
    const item = state.find(item => item.id === action);
    if (!item?.visible) {
      return state.filter(notification => notification.id !== action);
    } else {
      return state.map(notification => {
        if (notification.id === action) {
          return {...notification, visible: false};
        }
        return notification;
      });
    }
  }
  return [action, ...state];
}
export let toast = (
  notification: Omit<Notification, "id" | "visible" | "pause" | "resume">
) => {};
export default function ToastContainer() {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  useEffect(() => {
    let timeouts: Record<string, ReturnType<typeof setTimeout>> = {};
    toast = (
      notification: Omit<Notification, "id" | "visible" | "pause" | "resume">
    ) => {
      const id = uniqid("tst-");
      const {duration = 5000} = notification;
      dispatch({
        ...notification,
        id,
        visible: true,
        pause: () => clearTimeout(timeouts[id]),
        resume: () => setTimeout(() => dispatch(id), duration),
      });
      timeouts[id] = setTimeout(() => {
        dispatch(id);
        delete timeouts[id];
        timeouts[uniqid()] = setTimeout(() => dispatch(id), 1000);
      }, duration);
    };
    return () => {
      for (let timeout in timeouts) {
        clearTimeout(timeouts[timeout]);
      }
    };
  }, []);

  let [portalRef, setPortalRef] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!portalRef) {
      const div = document.createElement("div");
      div.className = "toast-container";
      document.body.appendChild(div);
      setPortalRef(div);
    }
  }, [portalRef]);
  if (!portalRef) {
    return null;
  }
  return createPortal(
    <div className="toast-container fixed top-0 right-0 z-20">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} dismiss={() => dispatch(toast.id)} />
      ))}
    </div>,
    portalRef
  );
}
