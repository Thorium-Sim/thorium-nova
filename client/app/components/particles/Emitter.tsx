import type { GroupProps } from "@react-three/fiber";
import {
	type ReactNode,
	useRef,
	createContext,
	useContext,
	forwardRef,
} from "react";
import { Vector3, type Group } from "three";
import type { Angle } from "./types";

const EmitterContext = createContext<{
	emissionAngleRange: Angle;
	getEmitterPosition: () => Vector3;
}>({
	emissionAngleRange: { longitude: 0, latitude: 0 },
	getEmitterPosition: () => new Vector3(0, 0, 0),
});

export const useEmitter = () => {
	return useContext(EmitterContext);
};
/**
 * A component that emits children based on the specified angular range in 3D space.
 *
 * @param {object} props - The properties for the Emitter component.
 * @param {ReactNode} props.children - The children to be emitted.
 * @param {object} [props.emissionAngleRange] - How the emission angle varies in 3D space both positive and negative.
 * @param {number} [props.emissionAngleRange.longitude=0] - The azimuthal angle from 0˚ to 180˚.
 * @param {number} [props.emissionAngleRange.latitude=0] - The polar angle from 0˚ to 90˚.
 * @returns {ReactNode} The emitted children.
 */
export const Emitter = forwardRef<
	Group,
	{
		children: ReactNode;
		emissionAngleRange?: Angle;
	} & GroupProps
>(
	(
		{ children, emissionAngleRange = { longitude: 0, latitude: 0 }, ...props },
		forwardedRef,
	) => {
		const innerRef = useRef<Group>(null);
		const ref = mergeRefs([forwardedRef, innerRef]);
		return (
			<group {...props} ref={ref}>
				<EmitterContext.Provider
					value={{
						emissionAngleRange,
						getEmitterPosition: () => innerRef.current?.position!,
					}}
				>
					{children}
				</EmitterContext.Provider>
			</group>
		);
	},
);
Emitter.displayName = "Emitter";

function mergeRefs<T = any>(
	refs: Array<
		React.MutableRefObject<T> | React.LegacyRef<T> | undefined | null
	>,
): React.RefCallback<T> {
	return (value) => {
		refs.forEach((ref) => {
			if (typeof ref === "function") {
				ref(value);
			} else if (ref != null) {
				(ref as React.MutableRefObject<T | null>).current = value;
			}
		});
	};
}
