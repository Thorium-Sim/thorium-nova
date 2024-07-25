import { LinearSpline } from "@client/components/particles/LinearSpline";
import { SpriteCell } from "@client/components/particles/SpriteCell";
import { useLoader } from "@react-three/fiber";
import { AdditiveBlending, Color, TextureLoader } from "three";
import blob from "./blob.png?url";
import { Emitter } from "@client/components/particles/Emitter";

export default function Explosion() {
	const texture = useLoader(TextureLoader, blob);

	return (
		<>
			<Emitter
				rotation={[0, Math.PI / 2, 0]}
				emissionAngleRange={{ latitude: 0, longitude: 180 }}
			>
				<SpriteCell
					map={texture}
					blending={AdditiveBlending}
					initialCount={100}
					lifeInSeconds={2}
					lifeVariance={0.5}
					birthRatePerSecond={0}
					birthRateVariance={0}
					speed={5}
					speedVariance={0.9}
					colorOverLife={
						new LinearSpline({
							points: [
								[0, new Color("yellow")],
								[0.9, new Color("red")],
							],
						})
					}
					scale={0.1}
					scaleVariance={0.5}
					scalePercentOverLife={
						new LinearSpline({
							points: [
								[0, 0],
								[0.2, 1],
								[0.9, 1],
								[1, 0],
							],
						})
					}
				/>
			</Emitter>
			<Emitter
				rotation={[0, Math.PI / 2, 0]}
				emissionAngleRange={{ latitude: 90, longitude: 180 }}
			>
				<SpriteCell
					map={texture}
					blending={AdditiveBlending}
					initialCount={300}
					lifeInSeconds={2}
					lifeVariance={0.5}
					birthRatePerSecond={0}
					birthRateVariance={0}
					speed={1}
					speedVariance={0.9}
					colorOverLife={
						new LinearSpline({
							points: [
								[0, new Color("yellow")],
								[0.7, new Color("red")],
							],
						})
					}
					scale={0.4}
					scaleVariance={0.5}
					scalePercentOverLife={
						new LinearSpline({
							points: [
								[0, 0],
								[0.2, 1],
								[0.9, 1],
								[1, 0],
							],
						})
					}
				/>
			</Emitter>
		</>
	);
}
