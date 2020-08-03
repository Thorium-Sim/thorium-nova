import produce, {applyPatches, enablePatches, Patch} from "immer";
import combinePatches from "../combinePatches";
enablePatches();

describe("combine patches", () => {
  it("should allow for strange combinations of original object and patches", () => {
    var patches: Patch[] = [];
    var state0: {a: number; b?: number} = {a: 1};
    var state1 = produce(
      state0,
      function (draft) {
        draft.b = 9;
      },
      function (p) {
        patches.push(...p);
      },
    );
    var state2 = produce(
      state1,
      function (draft) {
        draft.a = 3;
      },
      function (p) {
        patches.push(...p);
      },
    );
    var state3 = produce(
      state2,
      function (draft) {
        draft.b = 99;
      },
      function (p) {
        patches.push(...p);
      },
    );
    var state4 = produce(
      state3,
      function (draft) {
        draft.a = 5;
      },
      function (p) {
        patches.push(...p);
      },
    );

    expect(patches).toMatchInlineSnapshot(`
      Array [
        Object {
          "op": "add",
          "path": Array [
            "b",
          ],
          "value": 9,
        },
        Object {
          "op": "replace",
          "path": Array [
            "a",
          ],
          "value": 3,
        },
        Object {
          "op": "replace",
          "path": Array [
            "b",
          ],
          "value": 99,
        },
        Object {
          "op": "replace",
          "path": Array [
            "a",
          ],
          "value": 5,
        },
      ]
    `);

    combinePatches(state0, patches);

    expect(patches).toMatchInlineSnapshot(`
      Array [
        Object {
          "op": "add",
          "path": Array [
            "b",
          ],
          "value": 9,
        },
        Object {
          "op": "replace",
          "path": Array [
            "a",
          ],
          "value": 3,
        },
        Object {
          "op": "replace",
          "path": Array [
            "b",
          ],
          "value": 99,
        },
        Object {
          "op": "replace",
          "path": Array [
            "a",
          ],
          "value": 5,
        },
      ]
    `);
  });
});
