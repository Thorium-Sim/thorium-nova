import produce, {applyPatches, Patch} from "immer";

export default function combinePatches(state0: any, patches: Patch[]) {
  let newPatches: Patch[] = [];
  produce(
    state0,
    function (draft) {
      applyPatches(draft, patches);
    },
    function (p) {
      newPatches = p;
    },
  );
  return newPatches;
}
