import {RefObject} from "react";
import {useSpring} from "react-spring";
import {useDrag} from "react-use-gesture";

export function usePip(ref: RefObject<HTMLElement>) {
  const [styles, set] = useSpring(() => ({
    x: 10,
    y: 10,
  }));
  const bind = useDrag(
    ({down, last, movement: [x, y], metaKey}) => {
      let defaultX = 10;
      let defaultY = 10;
      if (last && ref.current) {
        const rect = ref.current.getBoundingClientRect();
        if (rect.x + rect.width / 2 > window.innerWidth / 2) {
          defaultX = window.innerWidth - 10 - rect.width;
        }
        if (rect.y + rect.height / 2 > window.innerHeight / 2) {
          defaultY = window.innerHeight - 10 - rect.height;
        }
      }
      set({
        x: down || metaKey ? x : defaultX,
        y: down || metaKey ? y : defaultY,
        immediate: down,
      });
    },
    {initial: () => [styles.x.get(), styles.y.get()]}
  );
  return [bind, {...styles, position: "fixed", left: 0, top: 0}] as const;
}
