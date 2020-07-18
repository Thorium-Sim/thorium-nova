Entity Component System
=======================

> Entity-component-system (ECS) is an architectural pattern that is mostly 
> used in game development. An ECS follows the Composition over inheritance 
> principle that allows greater flexibility in defining entities where every 
> object in a game's scene is an entity (e.g. enemies, bullets, vehicles, 
> etc.).
> *Thanks Wikipédia*

This library implement the entity component system pattern in EcmaScript6.

## Features

 * ES6. 
 * Barebone. No bullshit. No black magic. Take a look at the sources.
 * Flexible. You can subclass the Entity or UIDGenerator classes to implement your own logic. e.g. extend the System class in an EventEmitterSystem class to allow inter-system communication!
 * Fast. Intelligently batch your entities and systems so that the minimum amount of time is spent on pure iteration. Benchmarks in a <hope>near</hope> future.
 * Fast even for ECS. The eligibility to systems is computed only when components list change, and in most cases the overhead of systems eligibility will be computed once per entity, when added. Therefore there is no overhead for most iterations. [Iteration is often considered as a flaw of ecs pattern](https://en.wikipedia.org/wiki/Entity_component_system#Drawbacks).

## Getting started

Here is a "minimalist" example of what you can do with `yagl-ecs`. This example is not functionnal and not very useful but illustrate how to declare your components, systems and entities and how to cook that:

```js
import ECS from 'yagl-ecs';
// fake class from example with a keyPressed() method
import Keyboard from 'my/game/keyboard';

// components definitions
const Position = {
    // you can access the component data on each entity with `entity.components.pos`
    name: 'pos',
    // defaults attributes for the component. If not precised a void object {} 
    // is assigned instead.
    defaults: {x: 0, y: 0}
};

// update entity position based on key pressed
class KeyboardControlSystem extends ECS.Sytem {
    // called each game loop
    update(entity) {
        let {pos} = entity.components;

        // update the entity position according to what is pressed
        // can be implemented much better :) kiss for example
        if (Keyboard.keyPressed('up')) return pos.y -= 1;
        if (Keyboard.keyPressed('down')) return pos.y += 1;
        if (Keyboard.keyPressed('left')) return pos.x -= 1;
        if (Keyboard.keyPressed('right')) return pos.x += 1;
    }
}

// render entities as square
class RenderingSystem extends ECS.System {
    // when constructing this system you must pass a canvas context
    constructor(ctx) {
        this.ctx = ctx;
    }
    // only entities passing this test will be added to this system
    // if omitted, all entities are added
    test(entity) {
        // the entity must have a position component
        return !!entity.components.pos;
    }
    // called when an entity is added to the system
    enter(entity) {
        // super useful variable (and comment)
        entity.iAmRendered = true;
    }
    update(entity) {
        let {pos} = entity.components;

        this.ctx.fillRect(pos.x - 5, pos.y - 5, 10, 10);
    }
    // called when an entity is removed the system
    exit(entity) {
        entity.iAmRendered = false;
    }
}

// This is a debugging system that you will typically use during development
// but that you want to remove in production. Nothing easier with ECS
class DebugSystem extends ECS.System {
    // called when an entity is added to the system
    enter(entity) {
        // attach entity to window so the dev can play with it in the console
        // note: don't forget this is an example, no real world code
        window.ecsDebugEntity = entity;
    }
    // There is not update() method. Apart from enter() and exit(), this system
    // has no overhead on the game loop

    // called when an entity is removed from the system
    exit(entity) {
        window.ecsDebugEntity = null;
    }
}

// game loop
let canvas, ctx, ecs;
function gameLoop() {
    canvas.width = canvas.width; // reset the canvas - harsh way.

    // iterate through entities and apply elligible system
    ecs.update();

    requestAnimationFrame(gameLoop);
}

// game initialisation
canvas = document.getElementById('renderer');
ctx = canvas.getContext('2d');

ecs = new ECS();

// add the system. you can do this at any time since adding/removing a system
// to the ECS will take into account existing entities
ecs.addSystem(new KeyboardControlSystem());
ecs.addSystem(new RenderingSystem(ctx));
if (DEBUG_ENABLED) ecs.addSystem(new DebugSystem());

// then you can start to add entities
// note: in this example the keyboard control ALL entities on screen
let entity = new ECS.Entity([Position]);

// At the beginning we place the entity at the center
// 
// updateComponent() is another way to update component data
// IMO I prefer accessing components directly inside system update() method 
// because this is faster than method call. Anyway, this form is more 
// convenient for entity initialisation because it does a merge with defaults
// component attributes
entity.updateComponent('pos', {
    x: canvas.width / 2,
    y: canvas.height / 2
});

// finally start the game loop
gameLoop();
```

As soon as I have time, I'll provide a real world live example on [yagl.github.io](yagl.github.io). 

If you have more in-depth questions about how to structure a bigger project with ECS, do not hesitate to contact me. I would be happy to give you tips on components and systems encapsulation (this is very important for ECS pattern, your systems and components must be as atomic as possible).

## Documentation

The full documentation of methods can be found on [yagl.github.io/docs/ecs](yagl.github.io/docs/ecs). Please note that documentation is still a WIP.

## Roadmap

I'll publish the 0.1 by the end of march. Below a list of TODOs even if the target is not 0.1.

 * Maybe more unit test
 * Complete and publish documentation
 * Maybe create a benchmark to track performance evolution

## License

Copyright (c) 2015 Pierre BEAUJEU

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
