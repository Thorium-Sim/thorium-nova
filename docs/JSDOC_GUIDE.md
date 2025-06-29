# JSDoc Documentation Guide

## Table of Contents
1. [Overview](#overview)
2. [Basic JSDoc Syntax](#basic-jsdoc-syntax)
3. [Documentation Templates](#documentation-templates)
4. [ECS Component Documentation](#ecs-component-documentation)
5. [System Documentation](#system-documentation)
6. [Router Procedure Documentation](#router-procedure-documentation)
7. [React Component Documentation](#react-component-documentation)
8. [Utility Function Documentation](#utility-function-documentation)
9. [Best Practices](#best-practices)
10. [TypeDoc Integration](#typedoc-integration)

## Overview

JSDoc is used throughout Thorium Nova to provide comprehensive documentation for all code. Well-documented code is essential for:

- **Developer onboarding** - New developers can understand code quickly
- **API documentation generation** - Automatic documentation from code comments
- **IDE support** - Better IntelliSense and type hints
- **Maintenance** - Understanding complex logic months later

## Basic JSDoc Syntax

### Essential Tags

```typescript
/**
 * Brief one-line description of the function/class/component.
 * 
 * @description
 * More detailed explanation of what this does, how it works,
 * and when you should use it. Can span multiple lines.
 * 
 * @param {Type} paramName - Description of parameter
 * @param {Type} [optionalParam] - Optional parameter description
 * @param {Type} [optionalParam=defaultValue] - Optional with default
 * 
 * @returns {Type} Description of return value
 * 
 * @throws {ErrorType} When this error might be thrown
 * 
 * @example
 * ```typescript
 * // Example usage
 * const result = myFunction(param1, param2);
 * ```
 * 
 * @see {@link RelatedFunction} - Link to related functionality
 * @see {@link https://example.com} - External documentation
 * 
 * @since 1.0.0
 * @author Developer Name
 * @deprecated Use newFunction() instead
 */
```

### Common Tags Reference

- `@description` - Detailed explanation
- `@param` - Function parameters
- `@returns` - Return value description
- `@throws` - Exceptions that may be thrown
- `@example` - Usage examples
- `@see` - Links to related items
- `@since` - Version when added
- `@author` - Code author
- `@deprecated` - Mark as outdated
- `@todo` - Known issues or planned improvements
- `@internal` - Internal implementation details
- `@public` - Public API (default)
- `@private` - Private implementation
- `@readonly` - Read-only property

## Documentation Templates

### Function Template

```typescript
/**
 * Brief description of what the function does.
 * 
 * @description
 * Detailed explanation of the function's purpose, algorithm,
 * and any important implementation details.
 * 
 * @param {ParameterType} paramName - Description of parameter
 * @param {OptionalType} [optionalParam] - Optional parameter
 * @returns {ReturnType} Description of return value
 * 
 * @example
 * ```typescript
 * const result = functionName(param1, param2);
 * console.log(result); // Expected output
 * ```
 * 
 * @throws {Error} When invalid parameters are provided
 * @see {@link RelatedFunction}
 * @since 1.0.0
 */
function functionName(paramName: ParameterType, optionalParam?: OptionalType): ReturnType {
  // Implementation
}
```

### Class Template

```typescript
/**
 * Brief description of the class purpose.
 * 
 * @description
 * Detailed explanation of what this class represents,
 * its main responsibilities, and how it fits into the
 * overall system architecture.
 * 
 * @example
 * ```typescript
 * const instance = new ClassName(config);
 * instance.method();
 * ```
 * 
 * @see {@link RelatedClass}
 * @since 1.0.0
 */
class ClassName {
  /**
   * Creates a new instance of ClassName.
   * 
   * @param {ConfigType} config - Configuration options
   * @throws {Error} When configuration is invalid
   */
  constructor(config: ConfigType) {
    // Implementation
  }

  /**
   * Description of what this method does.
   * 
   * @param {ParamType} param - Method parameter
   * @returns {ReturnType} Description of return value
   * 
   * @example
   * ```typescript
   * const result = instance.methodName(param);
   * ```
   */
  methodName(param: ParamType): ReturnType {
    // Implementation
  }

  /**
   * Property description.
   * 
   * @readonly
   * @since 1.1.0
   */
  readonly propertyName: PropertyType;
}
```

### Interface Template

```typescript
/**
 * Description of what this interface represents.
 * 
 * @description
 * Detailed explanation of when to use this interface,
 * what it models, and any constraints or conventions.
 * 
 * @example
 * ```typescript
 * const data: InterfaceName = {
 *   property1: "value",
 *   property2: 42
 * };
 * ```
 * 
 * @since 1.0.0
 */
interface InterfaceName {
  /**
   * Description of this property.
   * 
   * @example "USS Enterprise"
   */
  property1: string;

  /**
   * Numeric property description.
   * 
   * @minimum 0
   * @maximum 100
   */
  property2: number;

  /**
   * Optional property description.
   */
  optionalProperty?: boolean;

  /**
   * Method description.
   * 
   * @param param - Parameter description
   * @returns Return value description
   */
  methodName(param: ParamType): ReturnType;
}
```

## ECS Component Documentation

### Component Definition

```typescript
/**
 * Represents the identity and basic information of an entity.
 * 
 * @description
 * The Identity component provides basic identification information
 * for any entity in the game world. This includes a human-readable
 * name and optional description. Nearly all entities should have
 * this component for debugging and UI purposes.
 * 
 * @example
 * ```typescript
 * entity.addComponent("identity", {
 *   name: "USS Enterprise",
 *   description: "Constitution-class starship"
 * });
 * ```
 * 
 * @see {@link Entity}
 * @see {@link Component}
 * @since 1.0.0
 */
export interface IdentityComponent {
  /**
   * Human-readable name for the entity.
   * 
   * @example "USS Enterprise"
   * @example "Phaser Array Alpha"
   */
  name: string;

  /**
   * Optional detailed description of the entity.
   * 
   * @example "Constitution-class heavy cruiser"
   */
  description?: string;
}

/**
 * Identity component instance.
 * 
 * @see {@link IdentityComponent}
 */
export const identity = new Component<IdentityComponent>();
```

### Ship System Component

```typescript
/**
 * Phaser weapon system component data.
 * 
 * @description
 * Contains all data necessary for phaser weapon systems including
 * charge levels, firing state, and system configuration. Phasers
 * are direct-energy weapons that fire coherent energy beams.
 * 
 * @example
 * ```typescript
 * entity.addComponent("isPhasers", {
 *   charge: 100,
 *   maxCharge: 100,
 *   chargeRate: 10,
 *   firing: false,
 *   cycleTime: 2000
 * });
 * ```
 * 
 * @see {@link PhasersSystem}
 * @see {@link WeaponsCard}
 * @since 1.0.0
 */
export interface PhasersComponent {
  /**
   * Current charge level (0-maxCharge).
   * 
   * @minimum 0
   * @maximum maxCharge
   */
  charge: number;

  /**
   * Maximum charge this phaser can hold.
   * 
   * @minimum 1
   * @example 100
   */
  maxCharge: number;

  /**
   * Rate at which the phaser charges per second.
   * 
   * @minimum 0
   * @example 10
   */
  chargeRate: number;

  /**
   * Whether the phaser is currently firing.
   * 
   * @readonly
   */
  firing: boolean;

  /**
   * Minimum time between shots in milliseconds.
   * 
   * @minimum 0
   * @example 2000
   */
  cycleTime: number;

  /**
   * Timestamp of last shot fired.
   * 
   * @internal
   */
  lastFired?: number;
}

/**
 * Phaser system component instance.
 * 
 * @see {@link PhasersComponent}
 */
export const isPhasers = new Component<PhasersComponent>();
```

## System Documentation

### ECS System Class

```typescript
/**
 * Processes phaser weapon systems for firing and charging.
 * 
 * @description
 * The PhasersSystem handles all phaser-related logic including:
 * - Automatic charging when not firing
 * - Firing mechanics and targeting
 * - Heat generation and cooling
 * - Power consumption calculations
 * 
 * This system runs every frame and processes all entities with
 * the isPhasers component.
 * 
 * @example
 * ```typescript
 * const system = new PhasersSystem();
 * ecs.addSystem(system);
 * ```
 * 
 * @see {@link isPhasers}
 * @see {@link WeaponsCard}
 * @since 1.0.0
 */
export class PhasersSystem extends System {
  /**
   * Determines if this system should process the given entity.
   * 
   * @description
   * Entities must have isPhasers component and be attached to a ship
   * to be processed by this system.
   * 
   * @param {Entity} entity - Entity to test
   * @returns {boolean} True if entity should be processed
   * 
   * @example
   * ```typescript
   * const shouldProcess = system.test(phaserEntity);
   * ```
   */
  test(entity: Entity): boolean {
    return !!(
      entity.components.isPhasers && 
      entity.components.isShipSystem
    );
  }

  /**
   * Updates a single phaser system entity.
   * 
   * @description
   * Handles charging, firing, heat generation, and power consumption
   * for a phaser system. Called once per frame for each eligible entity.
   * 
   * @param {Entity} entity - Phaser system entity to update
   * @param {number} deltaTime - Time elapsed since last update (ms)
   * 
   * @example
   * ```typescript
   * system.update(phaserEntity, 16.67); // 60 FPS
   * ```
   * 
   * @see {@link test}
   * @since 1.0.0
   */
  update(entity: Entity, deltaTime: number): void {
    const phasers = entity.components.isPhasers!;
    const shipSystem = entity.components.isShipSystem!;
    
    // Charging logic
    if (!phasers.firing && phasers.charge < phasers.maxCharge) {
      this.chargePhasers(entity, deltaTime);
    }
    
    // Firing logic
    if (this.shouldFire(entity)) {
      this.firePhasers(entity);
    }
    
    // Heat and power management
    this.updateHeatAndPower(entity, deltaTime);
  }

  /**
   * Charges the phaser system based on available power.
   * 
   * @param {Entity} entity - Phaser entity
   * @param {number} deltaTime - Time elapsed (ms)
   * 
   * @private
   * @since 1.0.0
   */
  private chargePhasers(entity: Entity, deltaTime: number): void {
    // Implementation details...
  }

  /**
   * Determines if the phaser should fire based on targeting and charge.
   * 
   * @param {Entity} entity - Phaser entity
   * @returns {boolean} True if phaser should fire
   * 
   * @private
   * @since 1.0.0
   */
  private shouldFire(entity: Entity): boolean {
    // Implementation details...
  }

  /**
   * Executes the phaser firing sequence.
   * 
   * @param {Entity} entity - Phaser entity
   * 
   * @throws {Error} If targeting data is invalid
   * @private
   * @since 1.0.0
   */
  private firePhasers(entity: Entity): void {
    // Implementation details...
  }
}
```

## Router Procedure Documentation

### NetRequest Procedure

```typescript
/**
 * Navigation router procedures for ship movement and positioning.
 * 
 * @description
 * Provides procedures for getting and setting ship navigation data
 * including position, velocity, autopilot settings, and waypoints.
 * 
 * @see {@link NavigationCard}
 * @since 1.0.0
 */
export const navigation = t.router({
  /**
   * Sub-router for ship position data and controls.
   */
  position: t.router({
    /**
     * Gets current position and movement data for a ship.
     * 
     * @description
     * Returns the ship's current position, velocity, and rotation
     * in the solar system. Updates automatically when position changes.
     * 
     * @procedure netRequest
     * @input {{ shipId: number }}
     * @output {PositionData}
     * 
     * @example
     * ```typescript
     * const [position] = q.navigation.position.get.useNetRequest({ shipId: 123 });
     * console.log(position.x, position.y, position.z);
     * ```
     * 
     * @see {@link setDestination}
     * @since 1.0.0
     */
    get: t.procedure
      .input(z.object({ 
        /**
         * ID of the ship to get position for.
         */
        shipId: z.number().positive() 
      }))
      .filter((publish: { shipId: number }, { input }) => {
        return publish.shipId === input.shipId;
      })
      .request(({ ctx, input }) => {
        const ship = ctx.flight.ecs.getEntityById(input.shipId);
        if (!ship?.components.position) {
          throw new Error(`Ship ${input.shipId} not found or has no position`);
        }

        return {
          x: ship.components.position.x,
          y: ship.components.position.y,
          z: ship.components.position.z,
          velocity: ship.components.velocity || { x: 0, y: 0, z: 0 },
          rotation: ship.components.rotation || { x: 0, y: 0, z: 0, w: 1 }
        };
      }),

    /**
     * Sets the ship's destination for autopilot navigation.
     * 
     * @description
     * Configures the ship's autopilot system to navigate to the
     * specified coordinates. The ship will automatically adjust
     * heading and speed to reach the destination.
     * 
     * @procedure netSend
     * @input {SetDestinationInput}
     * @output {void}
     * 
     * @example
     * ```typescript
     * await q.navigation.position.setDestination.netSend({
     *   shipId: 123,
     *   x: 1000,
     *   y: 0,
     *   z: 500,
     *   maxSpeed: 0.5
     * });
     * ```
     * 
     * @throws {Error} When ship is not found
     * @throws {Error} When destination is invalid
     * 
     * @see {@link get}
     * @since 1.0.0
     */
    setDestination: t.procedure
      .input(z.object({
        /**
         * ID of the ship to set destination for.
         */
        shipId: z.number().positive(),
        
        /**
         * X coordinate of destination.
         */
        x: z.number(),
        
        /**
         * Y coordinate of destination.
         */
        y: z.number(),
        
        /**
         * Z coordinate of destination.
         */
        z: z.number(),
        
        /**
         * Maximum speed for autopilot (0-1).
         * @default 1.0
         */
        maxSpeed: z.number().min(0).max(1).default(1.0)
      }))
      .send(({ ctx, input }) => {
        const ship = ctx.flight.ecs.getEntityById(input.shipId);
        if (!ship) {
          throw new Error(`Ship ${input.shipId} not found`);
        }

        // Validate destination is not at ship's current position
        const position = ship.components.position;
        if (position && 
            Math.abs(position.x - input.x) < 1 &&
            Math.abs(position.y - input.y) < 1 &&
            Math.abs(position.z - input.z) < 1) {
          throw new Error("Destination too close to current position");
        }

        // Set autopilot destination
        ship.updateComponent("autopilot", {
          destination: { x: input.x, y: input.y, z: input.z },
          maxSpeed: input.maxSpeed,
          enabled: true
        });

        // Notify subscribers of navigation change
        pubsub.publish.navigation.position.get({ shipId: input.shipId });
      })
  })
});
```

## React Component Documentation

### Card Component

```typescript
/**
 * Navigation card component for ship piloting controls.
 * 
 * @description
 * Provides the main navigation interface for ship pilots including:
 * - Real-time position and velocity display
 * - Engine speed and heading controls
 * - Destination setting and autopilot
 * - Nearby object detection and display
 * 
 * This card is typically assigned to the Helm station but can be
 * used on any station that needs navigation capabilities.
 * 
 * @component
 * @example
 * ```tsx
 * <NavigationCard shipId={123} />
 * ```
 * 
 * @see {@link navigation} - Server procedures
 * @see {@link useNavigation} - Custom hook
 * @since 1.0.0
 */
const NavigationCard: CardComponent = ({ shipId }) => {
  // Real-time position data
  const [position] = q.navigation.position.get.useNetRequest({ shipId });
  const [nearbyObjects] = q.navigation.nearbyObjects.useDataStream({ shipId });
  
  // Engine controls
  const [engines] = q.pilot.impulseEngines.get.useNetRequest({ shipId });
  
  /**
   * Handles setting a new destination for autopilot.
   * 
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate  
   * @param {number} z - Z coordinate
   * 
   * @example
   * ```typescript
   * handleSetDestination(1000, 0, 500);
   * ```
   */
  const handleSetDestination = useCallback((x: number, y: number, z: number) => {
    q.navigation.position.setDestination.netSend({
      shipId,
      x,
      y,
      z,
      maxSpeed: 0.8
    });
  }, [shipId]);

  /**
   * Handles engine speed changes.
   * 
   * @param {number} speed - New speed (0-1)
   */
  const handleSpeedChange = useCallback((speed: number) => {
    q.pilot.impulseEngines.setSpeed.netSend({ shipId, speed });
  }, [shipId]);

  return (
    <Panel title="Navigation" className="navigation-card">
      <div className="grid grid-cols-2 gap-4">
        {/* Position Display */}
        <PositionDisplay 
          position={position} 
          className="col-span-2" 
        />
        
        {/* Engine Controls */}
        <EngineControls 
          engines={engines}
          onSpeedChange={handleSpeedChange}
        />
        
        {/* Starmap */}
        <StarMap 
          position={position}
          nearbyObjects={nearbyObjects}
          onSetDestination={handleSetDestination}
          className="col-span-2"
        />
      </div>
    </Panel>
  );
};

/**
 * Props for the NavigationCard component.
 * 
 * @see {@link CardComponent}
 */
interface NavigationCardProps {
  /**
   * ID of the ship this card controls.
   */
  shipId: number;
}

export default NavigationCard;
```

### Custom Hook

```typescript
/**
 * Custom hook for managing navigation state and operations.
 * 
 * @description
 * Provides a unified interface for navigation-related data and actions.
 * Handles caching, error states, and provides convenient methods for
 * common navigation operations.
 * 
 * @param {number} shipId - ID of the ship to manage navigation for
 * @returns {NavigationHookReturn} Navigation data and control functions
 * 
 * @example
 * ```typescript
 * const { position, setDestination, isMoving } = useNavigation(shipId);
 * 
 * if (isMoving) {
 *   console.log("Ship is in motion");
 * }
 * 
 * setDestination(1000, 0, 500);
 * ```
 * 
 * @see {@link NavigationCard}
 * @since 1.1.0
 */
export function useNavigation(shipId: number): NavigationHookReturn {
  // Data subscriptions
  const [position] = q.navigation.position.get.useNetRequest({ shipId });
  const [autopilot] = q.navigation.autopilot.get.useNetRequest({ shipId });
  
  /**
   * Sets ship destination with error handling.
   * 
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {number} [maxSpeed=1.0] - Maximum autopilot speed
   * 
   * @returns {Promise<void>}
   * @throws {Error} When destination setting fails
   */
  const setDestination = useCallback(async (
    x: number, 
    y: number, 
    z: number, 
    maxSpeed: number = 1.0
  ): Promise<void> => {
    try {
      await q.navigation.position.setDestination.netSend({
        shipId,
        x,
        y,
        z,
        maxSpeed
      });
    } catch (error) {
      console.error("Failed to set destination:", error);
      throw error;
    }
  }, [shipId]);

  /**
   * Calculated property indicating if ship is currently moving.
   */
  const isMoving = useMemo(() => {
    if (!position?.velocity) return false;
    const { x, y, z } = position.velocity;
    return Math.sqrt(x * x + y * y + z * z) > 0.1;
  }, [position?.velocity]);

  /**
   * Calculated distance to autopilot destination.
   */
  const distanceToDestination = useMemo(() => {
    if (!position || !autopilot?.destination) return null;
    
    const dx = autopilot.destination.x - position.x;
    const dy = autopilot.destination.y - position.y;
    const dz = autopilot.destination.z - position.z;
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }, [position, autopilot?.destination]);

  return {
    position,
    autopilot,
    isMoving,
    distanceToDestination,
    setDestination
  };
}

/**
 * Return type for the useNavigation hook.
 */
interface NavigationHookReturn {
  /**
   * Current ship position and velocity data.
   */
  position: PositionData | null;
  
  /**
   * Autopilot configuration and status.
   */
  autopilot: AutopilotData | null;
  
  /**
   * Whether the ship is currently moving.
   */
  isMoving: boolean;
  
  /**
   * Distance to autopilot destination in meters.
   * Null if no destination is set.
   */
  distanceToDestination: number | null;
  
  /**
   * Function to set ship destination.
   */
  setDestination: (x: number, y: number, z: number, maxSpeed?: number) => Promise<void>;
}
```

## Utility Function Documentation

### Mathematical Utilities

```typescript
/**
 * Mathematical utilities for 3D space calculations.
 * 
 * @description
 * Collection of functions for common 3D mathematical operations
 * used throughout the game engine including vector math, rotations,
 * and coordinate transformations.
 * 
 * @namespace Math3D
 * @since 1.0.0
 */

/**
 * Calculates the distance between two 3D points.
 * 
 * @description
 * Uses the Euclidean distance formula to calculate the straight-line
 * distance between two points in 3D space. Commonly used for
 * proximity detection and navigation calculations.
 * 
 * @param {Vector3} point1 - First point coordinates
 * @param {Vector3} point2 - Second point coordinates
 * @returns {number} Distance in the same units as input coordinates
 * 
 * @example
 * ```typescript
 * const distance = calculateDistance(
 *   { x: 0, y: 0, z: 0 },
 *   { x: 3, y: 4, z: 0 }
 * );
 * console.log(distance); // 5
 * ```
 * 
 * @example
 * ```typescript
 * // Ship-to-target distance
 * const range = calculateDistance(ship.position, target.position);
 * if (range < weaponRange) {
 *   // Target is in range
 * }
 * ```
 * 
 * @see {@link Vector3}
 * @since 1.0.0
 */
export function calculateDistance(point1: Vector3, point2: Vector3): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const dz = point2.z - point1.z;
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Normalizes a 3D vector to unit length.
 * 
 * @description
 * Converts a vector to have a magnitude of 1 while preserving its direction.
 * Returns a zero vector if the input vector has zero magnitude to avoid
 * division by zero.
 * 
 * @param {Vector3} vector - Vector to normalize
 * @returns {Vector3} Normalized vector with magnitude 1 (or zero vector)
 * 
 * @example
 * ```typescript
 * const direction = normalizeVector({ x: 3, y: 4, z: 0 });
 * console.log(direction); // { x: 0.6, y: 0.8, z: 0 }
 * ```
 * 
 * @example
 * ```typescript
 * // Calculate heading vector from ship to target
 * const toTarget = {
 *   x: target.x - ship.x,
 *   y: target.y - ship.y,
 *   z: target.z - ship.z
 * };
 * const heading = normalizeVector(toTarget);
 * ```
 * 
 * @see {@link calculateDistance}
 * @see {@link multiplyVector}
 * @since 1.0.0
 */
export function normalizeVector(vector: Vector3): Vector3 {
  const magnitude = Math.sqrt(
    vector.x * vector.x + 
    vector.y * vector.y + 
    vector.z * vector.z
  );
  
  // Avoid division by zero
  if (magnitude === 0) {
    return { x: 0, y: 0, z: 0 };
  }
  
  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
    z: vector.z / magnitude
  };
}

/**
 * Interpolates between two 3D points using linear interpolation.
 * 
 * @description
 * Performs linear interpolation (lerp) between two points. When alpha is 0,
 * returns point1. When alpha is 1, returns point2. Values between 0 and 1
 * return points along the line between point1 and point2.
 * 
 * @param {Vector3} point1 - Starting point (alpha = 0)
 * @param {Vector3} point2 - Ending point (alpha = 1)
 * @param {number} alpha - Interpolation factor (0-1)
 * @returns {Vector3} Interpolated point
 * 
 * @example
 * ```typescript
 * const start = { x: 0, y: 0, z: 0 };
 * const end = { x: 10, y: 10, z: 10 };
 * const halfway = interpolatePoints(start, end, 0.5);
 * console.log(halfway); // { x: 5, y: 5, z: 5 }
 * ```
 * 
 * @example
 * ```typescript
 * // Smooth ship movement animation
 * const smoothPosition = interpolatePoints(
 *   currentPosition,
 *   targetPosition,
 *   deltaTime * smoothingFactor
 * );
 * ```
 * 
 * @throws {RangeError} When alpha is outside 0-1 range
 * @see {@link calculateDistance}
 * @since 1.0.0
 */
export function interpolatePoints(
  point1: Vector3, 
  point2: Vector3, 
  alpha: number
): Vector3 {
  if (alpha < 0 || alpha > 1) {
    throw new RangeError("Alpha must be between 0 and 1");
  }
  
  return {
    x: point1.x + (point2.x - point1.x) * alpha,
    y: point1.y + (point2.y - point1.y) * alpha,
    z: point1.z + (point2.z - point1.z) * alpha
  };
}

/**
 * 3D vector or point interface.
 * 
 * @description
 * Standard interface for representing points or vectors in 3D space.
 * Used throughout the engine for positions, velocities, directions, etc.
 */
interface Vector3 {
  /**
   * X coordinate or X component of vector.
   */
  x: number;
  
  /**
   * Y coordinate or Y component of vector.
   */
  y: number;
  
  /**
   * Z coordinate or Z component of vector.
   */
  z: number;
}
```

## Best Practices

### Documentation Quality

1. **Write for your future self** - Document as if you'll read it in 6 months
2. **Explain the "why"** - Not just what the code does, but why it exists
3. **Include examples** - Real usage examples are invaluable
4. **Keep it current** - Update docs when code changes
5. **Use consistent terminology** - Stick to established terms

### Documentation Structure

```typescript
/**
 * One-line summary (required)
 * 
 * @description
 * Detailed explanation (recommended for complex functions)
 * 
 * @param {Type} name - Description (required for each parameter)
 * @returns {Type} Description (required if function returns value)
 * 
 * @example
 * Code example (highly recommended)
 * 
 * @throws {ErrorType} When error occurs (if applicable)
 * @see {@link RelatedItem} (if applicable)
 * @since Version (recommended for public APIs)
 */
```

### Common Patterns

#### Error Documentation
```typescript
/**
 * @throws {Error} When shipId is invalid
 * @throws {RangeError} When coordinates are out of bounds
 * @throws {TypeError} When required parameters are missing
 */
```

#### Complex Return Types
```typescript
/**
 * @returns {Promise<ShipData>} Resolves with ship data object containing:
 *   - `id` - Ship identifier
 *   - `position` - Current 3D coordinates
 *   - `systems` - Array of ship system entities
 *   - `status` - Overall ship status enum
 */
```

#### API Evolution
```typescript
/**
 * @deprecated Since version 1.2.0. Use newFunction() instead.
 * @see {@link newFunction}
 */

/**
 * @since 1.1.0
 * @beta This API is experimental and may change
 */

/**
 * @todo Add support for custom coordinate systems
 * @todo Optimize for large datasets
 */
```

### IDE Integration

Most modern IDEs will display JSDoc comments when hovering over functions or when using autocomplete. This makes good documentation immediately valuable to developers.

```typescript
// When hovering over calculateDistance(), IDE shows:
// calculateDistance(point1: Vector3, point2: Vector3): number
// Calculates the distance between two 3D points.
// 
// Uses the Euclidean distance formula...
```

## TypeDoc Integration

### Configuration

Create `typedoc.json`:
```json
{
  "entryPoints": ["./app"],
  "out": "./docs/api",
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/node_modules/**"
  ],
  "excludePrivate": true,
  "excludeProtected": false,
  "excludeInternal": false,
  "includeVersion": true,
  "sort": ["source-order"],
  "kindSortOrder": [
    "Module",
    "Namespace", 
    "Class",
    "Interface",
    "TypeAlias",
    "Function",
    "Variable"
  ]
}
```

### Generate Documentation

```bash
# Install TypeDoc
npm install --save-dev typedoc

# Generate API documentation
npx typedoc

# Generated docs will be in docs/api/
```

### Publishing Documentation

```bash
# Build documentation site
npm run docs:build

# Deploy to GitHub Pages
npm run docs:deploy
```

This comprehensive JSDoc guide ensures all Thorium Nova code is properly documented, making the codebase accessible to new developers and maintainable for existing ones.