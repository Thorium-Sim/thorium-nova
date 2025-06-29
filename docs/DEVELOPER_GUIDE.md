# Thorium Nova Developer Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Development Environment Setup](#development-environment-setup)
3. [Codebase Structure](#codebase-structure)
4. [Core Concepts](#core-concepts)
5. [Common Development Tasks](#common-development-tasks)
6. [Testing Guide](#testing-guide)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites
- **Node.js 20+** (required for React Router)
- **Bun** (JavaScript runtime and package manager)
- **Git** (version control)
- **VS Code** (recommended editor with extensions)

### First Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/Thorium-Sim/thorium-nova.git
cd thorium-nova

# 2. Install dependencies
bun install

# 3. Start development server
bun run dev

# 4. Open your browser
# Navigate to http://localhost:3000
```

The development server starts both client and server:
- **Client**: React app on port 3000
- **Server**: Bun server on port 3001
- **Hot reload**: Both client and server automatically reload on changes

### Project Structure at a Glance

```
thorium-nova/
├── app/                    # Main application code
│   ├── .server/           # Server-only code
│   ├── cards/             # Station UI components
│   ├── components/        # Reusable UI components
│   ├── ecs-components/    # ECS component definitions
│   ├── routes/            # Page routes and documentation
│   └── utils/             # Shared utilities
├── data/                  # Development data and plugins
├── docs/                  # Comprehensive documentation
├── desktop/               # Tauri desktop app wrapper
└── scripts/               # Build and utility scripts
```

## Development Environment Setup

### VS Code Configuration

Install recommended extensions:
```bash
# Extensions are listed in .vscode/extensions.json
# VS Code will prompt to install them automatically
```

Key extensions:
- **TypeScript** - Language support
- **Biome** - Linting and formatting
- **Docker** - Container management
- **React** - JSX support

### Environment Variables

Create `.env.local` for local development:
```env
# AI Service Endpoints (optional)
OLLAMA_ENDPOINT=http://host.docker.internal:11434
COMFYUI_ENDPOINT=http://host.docker.internal:8188

# AI Configuration
AI_AGENTS_ENABLED=true
MAX_AI_AGENTS=4

# Development
NODE_ENV=development
DEBUG=thorium:*
```

### Git Workflow

This project uses conventional commits and semantic release:

```bash
# Feature branch workflow
git checkout -b feature/new-card
git add .
git commit -m "feat: add new navigation card"
git push origin feature/new-card

# Commit message format
# type(scope): description
# 
# Types: feat, fix, docs, style, refactor, test, chore
# Examples:
# feat(cards): add weapons targeting system
# fix(ecs): resolve component cache invalidation
# docs(api): update router procedure documentation
```

## Codebase Structure

### Server Architecture (`/app/.server/`)

```
.server/
├── init/                  # Server initialization
│   ├── buildDatabase.ts   # Database setup
│   ├── liveQuery.ts       # WebSocket handling
│   ├── pubsub.ts          # Event system
│   └── router.ts          # API routes
├── systems/               # ECS systems (game logic)
├── spawners/             # Entity creation utilities
├── data/                 # Router procedure definitions
└── classes/              # Core server classes
```

### Client Architecture (`/app/`)

```
app/
├── cards/                # Station UI screens
│   ├── Navigation/
│   │   ├── index.tsx     # Main component
│   │   ├── data.server.ts # Server procedures
│   │   └── styles.css    # Component styles
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI primitives
│   └── Starmap/         # Complex components
├── routes/              # Page routing
├── context/             # React contexts
└── hooks/               # Custom React hooks
```

### ECS Components (`/app/ecs-components/`)

```
ecs-components/
├── index.ts             # Component registry
├── identity.ts          # Basic entity identification
├── position.ts          # Spatial positioning
├── shipSystems/         # Ship system components
└── solarSystem/         # Space environment components
```

## Core Concepts

### Entity Component System (ECS)

ECS is the core architecture pattern for game state management:

```typescript
// 1. Entities are containers with unique IDs
const shipEntity = new Entity(12345);

// 2. Components store data
shipEntity.addComponent("identity", { 
  name: "USS Enterprise", 
  description: "Constitution-class starship" 
});

shipEntity.addComponent("position", { x: 1000, y: 0, z: 500 });
shipEntity.addComponent("velocity", { x: 0, y: 0, z: 10 });

// 3. Systems process entities with specific components
class MovementSystem extends System {
  test(entity: Entity) {
    return !!(entity.components.position && entity.components.velocity);
  }
  
  update(entity: Entity, deltaTime: number) {
    const { position, velocity } = entity.components;
    position.x += velocity.x * deltaTime;
    position.y += velocity.y * deltaTime;
    position.z += velocity.z * deltaTime;
  }
}
```

### Router Pattern (NetRequest/NetSend)

The router provides type-safe communication between client and server:

```typescript
// Server: Define procedures
export const navigation = t.router({
  position: t.procedure
    .input(z.object({ shipId: z.number() }))
    .request(({ ctx, input }) => {
      const ship = ctx.flight.ecs.getEntityById(input.shipId);
      return ship.components.position;
    }),
    
  setDestination: t.procedure
    .input(z.object({ 
      shipId: z.number(),
      x: z.number(),
      y: z.number(),
      z: z.number()
    }))
    .send(({ ctx, input }) => {
      const ship = ctx.flight.ecs.getEntityById(input.shipId);
      ship.updateComponent("autopilot", {
        destination: { x: input.x, y: input.y, z: input.z },
        enabled: true
      });
    })
});

// Client: Use procedures
function NavigationCard({ shipId }: CardProps) {
  // Subscribe to position updates
  const [position] = q.navigation.position.useNetRequest({ shipId });
  
  // Send commands
  const setDestination = (x: number, y: number, z: number) => {
    q.navigation.setDestination.netSend({ shipId, x, y, z });
  };
  
  return (
    <div>
      <p>Position: {position.x}, {position.y}, {position.z}</p>
      <button onClick={() => setDestination(2000, 0, 1000)}>
        Set Course
      </button>
    </div>
  );
}
```

### Plugin System

Plugins provide content and configuration using YAML definitions:

```yaml
# ships/constitution.yml
apiVersion: ships/v1
kind: ship
metadata:
  name: Constitution Class
  author: Thorium Team
spec:
  shipClass: Constitution
  mass: 190000  # metric tons
  volume: 211248  # cubic meters
  crew:
    min: 203
    max: 430
  systems:
    - type: warpEngines
      maxSpeed: 8.0
      cruiseSpeed: 6.0
    - type: phasers
      count: 6
      maxCharge: 100
    - type: shields
      maxStrength: 100
  assets:
    model: assets/constitution.gltf
    texture: assets/constitution_diffuse.png
```

## Common Development Tasks

### Creating a New Card

1. **Create the card directory:**
```bash
mkdir app/cards/MyNewCard
```

2. **Create the main component:**
```typescript
// app/cards/MyNewCard/index.tsx
import type { CardComponent } from "../CardProps";

const MyNewCard: CardComponent = ({ shipId }) => {
  // Subscribe to data
  const [systemData] = q.mySystem.status.useNetRequest({ shipId });
  
  // Handle user actions
  const activateSystem = () => {
    q.mySystem.activate.netSend({ shipId });
  };
  
  return (
    <div className="p-4">
      <h2>My New Card</h2>
      <p>Status: {systemData.status}</p>
      <button onClick={activateSystem}>Activate</button>
    </div>
  );
};

export default MyNewCard;
```

3. **Create server procedures:**
```typescript
// app/cards/MyNewCard/data.server.ts
import { t } from "@thorium/.server/init/t";
import { z } from "zod";

export const mySystem = t.router({
  status: t.procedure
    .input(z.object({ shipId: z.number() }))
    .filter((publish: { shipId: number }, { input }) => {
      return publish.shipId === input.shipId;
    })
    .request(({ ctx, input }) => {
      // Query ECS for system data
      const systems = getShipSystems(ctx.ecs, {
        shipId: input.shipId,
        systemType: "mySystem"
      });
      
      return {
        status: systems[0]?.components.mySystem?.status || "offline"
      };
    }),
    
  activate: t.procedure
    .input(z.object({ shipId: z.number() }))
    .send(({ ctx, input }) => {
      const systems = getShipSystems(ctx.ecs, {
        shipId: input.shipId,
        systemType: "mySystem"
      });
      
      systems[0]?.updateComponent("mySystem", { status: "active" });
      
      // Notify subscribers
      pubsub.publish.mySystem.status({ shipId: input.shipId });
    })
});
```

4. **Register the card:**
```typescript
// app/cards/index.ts
import MyNewCard from "./MyNewCard";

export const cards = {
  // ... existing cards
  "My New Card": MyNewCard,
};
```

### Adding an ECS Component

1. **Define the component:**
```typescript
// app/ecs-components/myComponent.ts
import { Component } from "@thorium/utils/ecs";

export interface MyComponentData {
  value: number;
  enabled: boolean;
  lastUpdate: number;
}

export const myComponent = new Component<MyComponentData>();
```

2. **Register in index:**
```typescript
// app/ecs-components/index.ts
export { myComponent } from "./myComponent";

export const components = {
  // ... existing components
  myComponent,
};
```

3. **Create a system to process it:**
```typescript
// app/.server/systems/MyComponentSystem.ts
import { System, type Entity } from "@thorium/utils/ecs";

export class MyComponentSystem extends System {
  test(entity: Entity) {
    return !!entity.components.myComponent;
  }
  
  update(entity: Entity, deltaTime: number) {
    const component = entity.components.myComponent;
    if (component.enabled) {
      component.value += deltaTime;
      component.lastUpdate = Date.now();
    }
  }
}
```

4. **Register the system:**
```typescript
// app/.server/systems/index.ts
import { MyComponentSystem } from "./MyComponentSystem";

export const systemClasses = [
  // ... existing systems
  MyComponentSystem,
];
```

### Creating a Plugin

1. **Create plugin directory:**
```bash
mkdir data/plugins/my-custom-plugin
```

2. **Create plugin manifest:**
```yaml
# data/plugins/my-custom-plugin/plugin.yml
apiVersion: v1
kind: plugin
metadata:
  name: My Custom Plugin
  version: 1.0.0
  author: Your Name
  description: Custom content for Thorium Nova
spec:
  aspects:
    - ships
    - timelines
    - themes
```

3. **Add content files:**
```yaml
# data/plugins/my-custom-plugin/ships/custom-ship.yml
apiVersion: ships/v1
kind: ship
metadata:
  name: Custom Frigate
spec:
  shipClass: Frigate
  mass: 750000
  systems:
    - type: phasers
      count: 4
```

4. **Plugin automatically loads on server restart**

### Writing Tests

1. **Unit tests for utilities:**
```typescript
// app/utils/myUtility.test.ts
import { describe, test, expect } from "vitest";
import { myUtility } from "./myUtility";

describe("myUtility", () => {
  test("should calculate correct value", () => {
    const result = myUtility(10, 20);
    expect(result).toBe(30);
  });
  
  test("should handle edge cases", () => {
    expect(myUtility(0, 0)).toBe(0);
    expect(myUtility(-5, 5)).toBe(0);
  });
});
```

2. **Component tests:**
```typescript
// app/cards/MyCard/MyCard.test.tsx
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockDataContext } from "@thorium/utils/.server/createMockDataContext";
import MyCard from "./index";

describe("MyCard", () => {
  test("renders correctly", () => {
    render(<MyCard shipId={123} />);
    expect(screen.getByText("My Card")).toBeInTheDocument();
  });
});
```

3. **ECS system tests:**
```typescript
// app/.server/systems/MySystem.test.ts
import { describe, test, expect } from "vitest";
import { ECS, Entity } from "@thorium/utils/ecs";
import { MySystem } from "./MySystem";

describe("MySystem", () => {
  test("processes entities correctly", () => {
    const ecs = new ECS();
    const system = new MySystem();
    const entity = new Entity();
    
    entity.addComponent("myComponent", { value: 0 });
    ecs.addEntity(entity);
    
    system.update(entity, 16); // 16ms frame
    
    expect(entity.components.myComponent.value).toBe(16);
  });
});
```

## Testing Guide

### Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode (for development)
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Run specific test file
bun test app/utils/myUtility.test.ts
```

### Test Structure

```
app/
├── utils/
│   ├── myUtility.ts
│   └── myUtility.test.ts     # Unit tests
├── cards/
│   └── MyCard/
│       ├── index.tsx
│       └── MyCard.test.tsx   # Component tests
└── .server/
    └── systems/
        ├── MySystem.ts
        └── MySystem.test.ts  # System tests
```

### Mock Data for Testing

```typescript
// Testing with mock ECS data
import { createMockDataContext } from "@thorium/utils/.server/createMockDataContext";

test("router procedure works correctly", async () => {
  const mockContext = createMockDataContext();
  
  // Add test entities
  const ship = mockContext.flight.ecs.addEntity({
    identity: { name: "Test Ship" },
    position: { x: 0, y: 0, z: 0 }
  });
  
  // Test procedure
  const result = await myProcedure({ 
    ctx: mockContext, 
    input: { shipId: ship.id } 
  });
  
  expect(result.position).toEqual({ x: 0, y: 0, z: 0 });
});
```

## Best Practices

### Code Organization

1. **Colocation**: Keep related code together
   ```
   /app/cards/Navigation/
   ├── index.tsx          # Main component
   ├── data.server.ts     # Server procedures
   ├── NavigationMap.tsx  # Sub-components
   ├── useNavigation.ts   # Custom hooks
   └── styles.css         # Component styles
   ```

2. **Separation of Concerns**:
   - **Components**: UI rendering only
   - **Hooks**: State management and side effects
   - **Procedures**: Server-side business logic
   - **Systems**: Game logic and entity processing

### Type Safety

1. **Use TypeScript everywhere**:
```typescript
// Define interfaces for complex data
interface ShipConfiguration {
  id: number;
  name: string;
  systems: SystemConfiguration[];
}

// Use proper typing for procedures
export const getShipConfig = t.procedure
  .input(z.object({ shipId: z.number() }))
  .output(z.custom<ShipConfiguration>())
  .request(({ input }) => {
    // Implementation with full type safety
  });
```

2. **Shared types between client and server**:
```typescript
// app/types/ship.ts - shared between client and server
export interface Position {
  x: number;
  y: number;
  z: number;
  parentId?: number;
}
```

### Performance

1. **Optimize ECS queries**:
```typescript
// Good: Use component cache
const shipsWithWeapons = ecs.getEntitiesWithComponents(["isShip", "weapons"]);

// Avoid: Filtering all entities
const shipsWithWeapons = ecs.entities.filter(e => 
  e.components.isShip && e.components.weapons
);
```

2. **Minimize React re-renders**:
```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Complex rendering logic
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return complexCalculation(inputData);
}, [inputData]);
```

3. **Efficient network usage**:
```typescript
// Batch updates when possible
const batchedUpdate = useMemo(() => {
  return debounce((updates: Update[]) => {
    q.batchUpdate.netSend({ updates });
  }, 100);
}, []);
```

### Error Handling

1. **Server-side error handling**:
```typescript
export const dangerousProcedure = t.procedure
  .input(z.object({ shipId: z.number() }))
  .send(({ ctx, input }) => {
    try {
      const ship = ctx.flight.ecs.getEntityById(input.shipId);
      if (!ship) {
        throw new Error(`Ship ${input.shipId} not found`);
      }
      
      // Procedure logic
    } catch (error) {
      console.error("Procedure failed:", error);
      throw error; // Re-throw for client handling
    }
  });
```

2. **Client-side error boundaries**:
```typescript
// Wrap components in error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <MyCard shipId={shipId} />
</ErrorBoundary>
```

### Security

1. **Input validation**:
```typescript
// Always validate inputs with Zod
const schema = z.object({
  shipId: z.number().positive(),
  speed: z.number().min(0).max(1),
  heading: z.number().min(0).max(360)
});
```

2. **Authorization checks**:
```typescript
export const restrictedProcedure = t.procedure
  .input(schema)
  .send(({ ctx, input }) => {
    // Check if client has permission
    if (!ctx.client.station?.hasNavigationAccess) {
      throw new Error("Unauthorized");
    }
    
    // Procedure logic
  });
```

## Troubleshooting

### Common Issues

#### 1. "Component not found" errors
```typescript
// Problem: Assuming component exists
entity.components.myComponent.value = 10; // May crash

// Solution: Always check component existence
if (entity.components.myComponent) {
  entity.components.myComponent.value = 10;
}

// Or use optional chaining
entity.components.myComponent?.value = 10;
```

#### 2. "System not updating entities"
```typescript
// Problem: System test function too restrictive
class MySystem extends System {
  test(entity: Entity) {
    // This will never match if any component is missing
    return !!(entity.components.a && entity.components.b && entity.components.c);
  }
}

// Solution: Only require essential components
class MySystem extends System {
  test(entity: Entity) {
    return !!entity.components.a; // Only require what you actually need
  }
  
  update(entity: Entity) {
    // Check optional components in update
    if (entity.components.b) {
      // Handle b-specific logic
    }
  }
}
```

#### 3. "Subscription not updating"
```typescript
// Problem: Missing or incorrect filter
const subscription = t.procedure
  .request(({ ctx }) => {
    // No filter means ALL clients get updates
    return getData();
  });

// Solution: Add appropriate filter
const subscription = t.procedure
  .filter((publish: { shipId: number }, { input }) => {
    return publish.shipId === input.shipId;
  })
  .request(({ ctx, input }) => {
    return getData(input.shipId);
  });
```

### Debug Tools

1. **ECS Inspector**:
```typescript
// Add to development code
if (process.env.NODE_ENV === "development") {
  globalThis.debugECS = () => {
    console.log("Entities:", ecs.entities.size);
    console.log("Systems:", ecs.systems.map(s => s.constructor.name));
  };
}
```

2. **Network debugging**:
```typescript
// Enable debug logging
localStorage.setItem("debug", "thorium:*");
```

3. **Component debugging**:
```typescript
// Debug specific entity
function debugEntity(entityId: number) {
  const entity = ecs.getEntityById(entityId);
  console.log("Entity:", entity);
  console.log("Components:", Object.keys(entity.components));
}
```

### Performance Debugging

1. **Profile system performance**:
```typescript
class ProfiledSystem extends System {
  update(entity: Entity, deltaTime: number) {
    const start = performance.now();
    
    // System logic here
    
    const end = performance.now();
    if (end - start > 1) { // Log if slower than 1ms
      console.warn(`${this.constructor.name} slow update: ${end - start}ms`);
    }
  }
}
```

2. **Monitor network traffic**:
```typescript
// In browser dev tools
navigator.serviceWorker.register("/debug-worker.js");
// Check Network tab for WebSocket messages
```

### Getting Help

1. **Check existing documentation**:
   - `/docs/` - Architecture guides
   - `/app/routes/docs/` - Feature documentation
   - Code comments and JSDoc

2. **Search codebase for examples**:
```bash
# Find similar implementations
grep -r "similar pattern" app/
```

3. **Use TypeScript IntelliSense**:
   - Hover over functions for documentation
   - Use "Go to Definition" (F12) to understand code flow
   - Use "Find All References" to see usage patterns

This developer guide provides everything needed to start contributing to Thorium Nova effectively. The combination of clear architecture, type safety, and comprehensive tooling makes development both productive and enjoyable.