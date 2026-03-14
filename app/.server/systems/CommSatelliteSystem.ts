import { pubsub } from "@thorium/.server/init/pubsub";
import {
	findClosestSatellite,
	pickNextLongRangeMessageNode,
} from "@thorium/cards/LongRangeComm/data.server";
import { type Entity, System } from "@thorium/utils/ecs";
import { getObjectSystem } from "@thorium/utils/starmap/position";
import { lightYearToLightMinute } from "@thorium/utils/unitTypes";
import { Vector3 } from "three";

export class CommSatelliteSystem extends System {
	static flightMode = ["nova"];

	test(entity: Entity) {
		return !!entity.components.isLongRangeMessage;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedRatio = elapsed / 1000;
		const { position, isLongRangeMessage } = entity.components;
		if (!position || !isLongRangeMessage) return;
		if (
			isLongRangeMessage.state !== "sending" &&
			isLongRangeMessage.state !== "failing"
		)
			return;
		const shipId = isLongRangeMessage.senderId;

		const { x, y, z } = position;

		const currentNode = this.ecs.getEntityById(isLongRangeMessage.nextNodeId);
		if (!currentNode) return;
		const nodePosition =
			getObjectSystem(currentNode)?.components.position ||
			currentNode.components.position;
		if (!nodePosition) return;

		const velocity =
			lightYearToLightMinute(isLongRangeMessage.transmissionSpeed) *
			elapsedRatio;
		const direction = new Vector3(
			nodePosition.x - x,
			nodePosition.y - y,
			nodePosition.z - z,
		)
			.normalize()
			.multiplyScalar(velocity);
		const currentDistance = Math.hypot(
			x - nodePosition.x,
			y - nodePosition.y,
			z - nodePosition.z,
		);

		const newX = x + direction.x;
		const newY = y + direction.y;
		const newZ = z + direction.z;

		const newDistance = Math.hypot(
			newX - nodePosition.x,
			newY - nodePosition.y,
			newZ - nodePosition.z,
		);

		// If we begin moving _away_ from the node, then that means we overshot and should
		// move on to the next node
		if (newDistance >= currentDistance) {
			entity.updateComponent("position", {
				x: nodePosition.x,
				y: nodePosition.y,
				z: nodePosition.z,
			});

			entity.updateComponent("isLongRangeMessage", {
				visitedNodeIds: [
					...isLongRangeMessage.visitedNodeIds,
					isLongRangeMessage.nextNodeId,
				],
			});

			// We'll do some special handling to hold intercepted messages
			const currentNode = this.ecs.getEntityById(
				entity.components.isLongRangeMessage?.nextNodeId || -1,
			);
			if (currentNode?.components.isPlayerShip) {
				entity.updateComponent("isLongRangeMessage", {
					interceptorId: currentNode.id,
					state: "intercepted",
				});
				pubsub.publish.longRangeComm.outgoingMessages({ shipId });
				pubsub.publish.longRangeComm.incomingMessages({ shipId });

				return;
			}

			// Regular comm satellites just send it along to the next satellite
			const satellites = Array.from(
				this.ecs.componentCache.get("isCommSatellite") || [],
			);
			const destination = this.ecs.getEntityById(
				isLongRangeMessage.destinationId,
			);
			if (!destination) {
				fail("Unable to determine destination");
				return;
			}
			const closestEndNode = findClosestSatellite(satellites, destination);
			if (!closestEndNode) {
				fail(
					"Unable to find route to destination through communications network",
				);
				return;
			}

			// If we reach the final node, then the last step is moving to the destination entity
			if (closestEndNode.id === isLongRangeMessage.nextNodeId) {
				// If its already failing, we'll just mark it as "undeliverable" and call it a day
				if (isLongRangeMessage.state === "failing") {
					fail("Failed to reach destination");
					return;
				}

				// But if the destination entity isn't in range, then we need to mark the message as failing
				const destinationEntity = this.ecs.getEntityById(
					isLongRangeMessage.destinationId,
				);
				const finalNode = this.ecs.getEntityById(isLongRangeMessage.nextNodeId);
				if (!finalNode || !destinationEntity) {
					fail(
						"Unable to find route to destination through communications network",
					);
					return;
				}

				// Get the position of the final satellite and the ship the message is supposed to go to
				const nodePosition =
					getObjectSystem(finalNode)?.components.position ||
					finalNode.components.position;
				const destinationPosition =
					getObjectSystem(destinationEntity)?.components.position ||
					destinationEntity?.components.position;
				if (!nodePosition || !destinationPosition) {
					fail("Unable to determine destination position");
					return;
				}

				const distance = Math.hypot(
					nodePosition.x - destinationPosition.x,
					nodePosition.y - destinationPosition.y,
					nodePosition.z - destinationPosition.z,
				);

				// The ship is outside the range of the final node
				if (distance > (finalNode.components.isCommSatellite?.radius || -1)) {
					// It failed!
					fail("Destination is outside communications network");
					return;
				} else {
					// Consider it sent!
					entity.updateComponent("isLongRangeMessage", { state: "delivered" });
					entity.removeComponent("position");
					pubsub.publish.longRangeComm.outgoingMessages({ shipId });
					pubsub.publish.longRangeComm.incomingMessages({ shipId });
				}
			} else {
				// Recalculate the graph and try again
				const nextNodeId = pickNextLongRangeMessageNode(
					this.ecs,
					isLongRangeMessage.nextNodeId,
					isLongRangeMessage.destinationId,
					isLongRangeMessage.visitedNodeIds,
				);
				entity.updateComponent("isLongRangeMessage", {
					nextNodeId,
				});
			}
		} else {
			entity.updateComponent("position", { x: newX, y: newY, z: newZ });
		}

		function fail(reason: string) {
			entity.updateComponent("isLongRangeMessage", {
				state: "undelivered",
				failureReason: reason,
			});
			console.error(reason);
			entity.removeComponent("position");
			pubsub.publish.longRangeComm.outgoingMessages({ shipId });
		}
	}
}
