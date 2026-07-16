import { type Entity, System } from "@thorium/utils/ecs";

export class EngineeringPanelAssignmentSystem extends System {
	static flightMode = ["legacy", "nova"];
	frequency = 5;
	test(entity: Entity) {
		return !!entity.components.panelAssignment;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedInSeconds = elapsed / 1000;
		const panelAssignment = entity.components.panelAssignment;
		if (!panelAssignment) return;
		const panel = this.ecs.getEntityById(panelAssignment.panelId);
		if (!panel?.components.isPanel) return;
		let progress = 0;
		for (const element of panelAssignment.elements) {
			if (element.complete) {
				progress += 1 / panelAssignment.elements.length;
				continue;
			}
			if (element.requiredConnection) {
				const cc = element.requiredConnection;
				if (!cc) continue;
				const connected = panel.components.isPanel.cables.some(
					(c) =>
						(c.handles[0].elementId === cc[0].elementId &&
							c.handles[0].portIndex === cc[0].portIndex &&
							c.handles[1].elementId === cc[1].elementId &&
							c.handles[1].portIndex === cc[1].portIndex) ||
						(c.handles[1].elementId === cc[0].elementId &&
							c.handles[1].portIndex === cc[0].portIndex &&
							c.handles[0].elementId === cc[1].elementId &&
							c.handles[0].portIndex === cc[1].portIndex),
				);
				if (connected) {
					progress += 1 / panelAssignment.elements.length;
					element.progress = 1;
					element.complete = true;
					continue;
				}
			}
			const elementEntity = this.ecs.getEntityById(element.id);
			if (!elementEntity?.components.isPanelElement) continue;
			const state = elementEntity.components.isPanelElement.state;

			if (element.requiredDuration > 0) {
				if (state === 1) {
					element.progress = Math.min(
						1,
						element.progress + elapsedInSeconds / element.requiredDuration,
					);
					if (element.progress >= 1) {
						element.complete = true;
					}
				}
			} else {
				element.complete = state === element.requiredState;
				element.progress = state === element.requiredState ? 1 : 0;
			}
			// Required Count is handled by the engineeringPanels.updateElement send
			progress += element.progress / panelAssignment.elements.length;
		}

		if (progress >= 1) {
			// Complete the assignment
			this.ecs.triggerAction("engineeringPanels.completeAssignment", { assignmentId: entity.id });
		}
	}
}
