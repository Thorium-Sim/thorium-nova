import {SnapshotInterpolation} from "../src";

const SI = new SnapshotInterpolation();
SI.interpolationBuffer.set(30); // this is only that low for testing
const tick = 1000 / 20;
let snapshot;
let id1;
let id2;
let interpolatedSnapshot;

const delay = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, tick);
  });
};

test("should be initialized", () => {
  expect(SI).not.toBeUndefined();
});

test("initialize with server fps", () => {
  const SI = new SnapshotInterpolation(20);
  const buffer = SI.interpolationBuffer.get();
  expect(buffer).toBe(150);
});

test("calc interpolated without any data", () => {
  interpolatedSnapshot = SI.calcInterpolation("x y d(deg) r(rad) q(quat)");
  expect(interpolatedSnapshot).toBeUndefined();
});

test("should create and add snapshot", async () => {
  await delay();
  snapshot = SI.snapshot.create([
    {id: "hero", x: 0, y: 0, d: 0, r: 0, q: {x: 0, y: 0, z: 0, w: 1}},
  ]);
  id1 = snapshot.id;
  SI.snapshot.add(snapshot);
  expect(snapshot).not.toBeUndefined();
});

test("calc interpolated with not enough data", async () => {
  await delay();
  interpolatedSnapshot = SI.calcInterpolation("x y d(deg) r(rad) q(quat)");
  expect(interpolatedSnapshot).toBeUndefined();
});

test("snapshot id should be 6 chars long", () => {
  expect(snapshot.id.length).toBe(6);
});

test("vault should have a size of one", () => {
  expect(SI.vault.size).toBe(1);
});

test("getting latest snapshot should have same id", () => {
  const s = SI.vault.get();
  expect(s.id).toBe(snapshot.id);
});

test("each entity should always have id", () => {
  expect(() => {
    SnapshotInterpolation.CreateSnapshot([{x: 10, y: 10}]);
  }).toThrow();
});

test("worldState should be an array", () => {
  expect(() => {
    SI.snapshot.create({
      id: "hero",
      x: 10,
      y: 10,
      d: 90,
      r: Math.PI / 4,
      q: {x: 0, y: 0.707, z: 0, w: 0.707},
    });
  }).toThrow();
});

test("should create and add another snapshot", async () => {
  await delay();
  snapshot = SI.snapshot.create([
    {
      id: "hero",
      x: 10,
      y: 10,
      d: 90,
      r: Math.PI / 4,
      q: {x: 0, y: 0.707, z: 0, w: 0.707},
    },
    {id: "enemyOne"},
  ]);
  id2 = snapshot.id;
  SI.snapshot.add(snapshot);
  expect(SI.vault.size).toBe(2);
});

test("should get interpolated value", () => {
  interpolatedSnapshot = SI.calcInterpolation("x y d(deg) r(rad) q(quat)");
  expect(interpolatedSnapshot).not.toBeUndefined();
});

test("can not interpolate strings", () => {
  expect(() => {
    SI.calcInterpolation("id");
  }).toThrow();
});

test("can not interpolated unknown method", () => {
  expect(() => {
    SI.calcInterpolation("x y d(mojito)");
  }).toThrow();
});

test("interpolate the value p, that is not there", () => {
  const snap = SI.calcInterpolation("x y d(deg) p");
  expect(snap.state[0].p).toBeUndefined();
});

test("should have same id as original snapshots", () => {
  const mergedId1 = interpolatedSnapshot.older + interpolatedSnapshot.newer;
  const mergedId2 = id1 + id2;
  expect(mergedId1).toBe(mergedId2);
});

test("values should be interpolated", () => {
  const entity = interpolatedSnapshot.state.find(e => e.id === "hero");

  expect(entity.x > 0 && entity.x < 10).toBeTruthy();
  expect(entity.r > 0 && entity.r < Math.PI / 4).toBeTruthy();
  expect(entity.d > 0 && entity.d < 90).toBeTruthy();
  expect(entity.q.w < 1 && entity.q.w > 0.707).toBeTruthy();
  expect(entity.q.y > 0 && entity.q.y < 0.707).toBeTruthy();
});

test("timeOffset should >= 0", () => {
  const timeOffset = SI.timeOffset;
  expect(timeOffset >= 0).toBeTruthy();
});

test("custom interpolation", () => {
  const shots = SI.vault.get(new Date().getTime() - 50);
  const interpolated = SI.interpolate(shots.older, shots.newer, 0.5, "x y");

  const x = interpolated.state[0].x;
  expect(x > 0 && x < 10).toBeTruthy();
  expect(interpolated.percentage).toBe(0.5);
});

test("custom interpolation (with deep)", () => {
  const shots = SI.vault.get(new Date().getTime() - 50);

  expect(() => {
    SI.interpolate(shots.older, shots.newer, 0.5, "x y", "players");
  }).toThrow();
});
