import { clientId, q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { useStation } from "@thorium/routes/station/useStation";

import "./effects.css";
import type { EffectPayload } from "@thorium/utils/flags/effects";
import { useAmbiance } from "@thorium/utils/sounds/Ambiance/useAmbiance";
import { useDialogue } from "@thorium/utils/sounds/useDialogue";
import uuid from "@thorium/utils/uniqid";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import Spark from "./spark";

let synth: SpeechSynthesis | undefined;
try {
	synth = window.speechSynthesis;
} catch {}

const useFlash = () => {
	const [flash, setFlash] = useState(false);
	const timeoutRef = useRef<number | undefined>(undefined);
	const doFlash = useCallback((duration: number, lastTime = Date.now()) => {
		clearTimeout(timeoutRef.current);
		duration = duration || duration === 0 ? duration : 1000;
		if (duration <= 0) {
			return setFlash(false);
		}
		setFlash((oldFlash) => !oldFlash);

		timeoutRef.current = setTimeout(
			() => doFlash(duration - (Date.now() - lastTime), Date.now()),
			75,
		) as unknown as number;
	}, []);
	useEffect(() => () => clearTimeout(timeoutRef.current), []);
	return { flash, doFlash };
};

const useSpark = () => {
	const [sparks, setSparks] = useState<string[]>([]);
	const timeoutRef = useRef<number[]>([]);
	const doSpark = useCallback((duration = 5000) => {
		const id = uuid();
		setSparks((sparks) => [...sparks, id]);
		const timeout = setTimeout(() => {
			setSparks((sparks) => sparks.filter((s) => s !== id));
		}, duration) as unknown as number;
		timeoutRef.current.push(timeout);
	}, []);
	useEffect(() => {
		return () => timeoutRef.current.forEach((ref) => clearTimeout(ref));
	}, []);
	return {
		doSpark,
		sparks,
	};
};

export function useEscapeHotkey() {
	const navigate = useNavigate();
	useEffect(() => {
		function handleKeydown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				navigate("/flight/lobby");
			}
		}
		document.addEventListener("keydown", handleKeydown);

		return () => document.removeEventListener("keydown", handleKeydown);
	}, [navigate]);
}

export class RadarZoomEvent extends Event {
	static name = "radarZoomEvent";
	zoom: number;
	constructor(payload: string) {
		super(RadarZoomEvent.name);
		this.zoom = Number(payload);
	}
}

const Effects = () => {
	const { flash, doFlash } = useFlash();
	const { doSpark, sparks } = useSpark();
	const { station } = useStation();
	useAmbiance();
	useDialogue();

	const doEffect = useCallback(
		(payload: EffectPayload) => {
			if (typeof payload === "boolean" || !payload) return;
			const { effect } = payload;
			switch (effect.type) {
				case "flash":
					return doFlash(effect.duration || 1000);
				case "spark":
					return doSpark(effect.duration || 5000);
				case "reload":
					return window.location.reload();
				case "speak": {
					try {
						const voices = synth?.getVoices() || [];
						if (!effect?.message) return;
						const words = new SpeechSynthesisUtterance(effect.message);
						if (words) {
							const voice = voices.find((v) => v.name === effect.voice) || voices[0];
							if (voice) {
								words.voice = voice;
							}
						}
						return synth?.speak(words);
					} catch {}
					break;
				}
				case "message": {
					let action = () => {};
					switch (effect.action?.type) {
						case "cardChange":
							for (const card of effect.action.cards) {
								if (station.cards.some((c) => c.name === card)) {
									action = () => {
										q.client.setCard.netSend({ clientId, card });
									};
									break;
								}
							}
							break;
					}
					toast({ ...effect, action });
					break;
				}
				// case "shutdown":
				// case "restart":
				// case "sleep":
				// case "quit":
				// case "beep":
				//   // TODO November 29, 2021: Implement the message transmission
				//   // to the Electron instance.
				//   // return window.thorium.sendMessage({effect});
				// break;
				default:
					return;
			}
		},
		[doFlash, doSpark, station.cards.some],
	);

	q.effects.sub.useNetSubscribe({ clientId }, doEffect);

	const doEvent = useCallback((payload: { name: string; payload: string }) => {
		switch (payload.name) {
			case RadarZoomEvent.name:
				window.dispatchEvent(new RadarZoomEvent(payload.payload));
		}
	}, []);

	q.effects.events.useNetSubscribe({ clientId }, doEvent);
	return (
		<div className={`actionsContainer ${flash ? "flash" : ""}`}>
			{sparks.map((s) => (
				<Spark key={s} />
			))}
		</div>
	);
};

export default Effects;
