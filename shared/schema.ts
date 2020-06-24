import {
  Model,
  BufferSchema,
  string8,
  uint8,
  int16,
  uint64,
} from "@geckos.io/typed-array-buffer-schema";

const positionSchema = BufferSchema.schema("Position", {
  x: int16,
  y: int16,
  z: int16,
});
const velocitySchema = BufferSchema.schema("Velocity", {
  x: int16,
  y: int16,
  z: int16,
});
const accelerationSchema = BufferSchema.schema("Acceleration", {
  x: int16,
  y: int16,
  z: int16,
});
const simulatorSchema = BufferSchema.schema("simulator", {
  id: uint8,
  Position: positionSchema,
  Velocity: velocitySchema,
  Acceleration: accelerationSchema,
});
const snapshotSchema = BufferSchema.schema("snapshot", {
  id: {type: string8, length: 6},
  time: uint64,
  state: {simulators: [simulatorSchema]},
});

export const snapshotModel = new Model(snapshotSchema);
