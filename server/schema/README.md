# GraphQL Schema

A few notes about why the GraphQL Schema is designed the way it is.

## TypeGraphQL

[TypeGraphQL](https://typegraphql.com) solves the double declaration problem on
the server. Instead of having to write out the schema in GraphQL SDL and then
write out all the resolvers and models, you just use the decorators from
TypeGraphQL to define your schema alongside the data and resolvers. This allows
for class composition to reuse field definitions, and collates the logic
together with the schema instead of needlessly separating it.

## Subscription LiveQueries

Subscriptions do something interesting with their topic functions:

```js
  @Subscription(returns => [Entity], {
    topics: ({args, payload, context}) => {
      const id = uniqid();
      process.nextTick(() => {
        pubsub.publish(id, {
          entities: App.activeFlight?.ecs.entities.filter(
            e => e.components.timer,
          ),
        });
      });
      return [id, "timers"];
    },
  })
  timers(@Root() payload: TimersPayload): Entity[] {
    return payload.entities || [];
  }
```

The reason for publishing on the next tick after a client subscribes is so
initial data can be sent down to the client. You can read more about that
[on my blog.](https://ralexanderson.com/blog/subscription-only-graphql-data)

Even though the primary data consumption mechanism for clients should be
subscriptions, there's no reason queries should be excluded. Every subscription
should have a matching query. This will be helpful for development as well as
third party services which rely on polling.

## Entity Component System

Thorium Nova uses ECS behind the scenes to manage and store most of the data.
Even though it would be possible to query all of the data from the Entity type,
and use a million filters to keep the data where it needs to be, it makes a lot
more sense to create multiple subscription resolvers for different varieties of
entity.

Same things goes for mutations - instead of having a `identityRename` mutation
which can be used to rename entities of any variety, having a separate mutation
for each entity variety, eg. `shipRename`, makes it easier to target the proper
subscription when publishing those updates and takes advantage of data that is
automatically passed via context. It also gives more flexibility to the
mutation, allowing for the mutation to be targeted with the ship data available
on the GraphQL context.

Finally, currently all queries and subscriptions return the `Entity` type, which
has all of the components available on it, whether the data has those components
or not. If necessary, it it possible to create separate GraphQL object type
definitions for each variety of entity which only has the components which apply
to that entity. This removes a bit of flexibility when it comes to adding
arbitrary components, so it likely won't happen.
