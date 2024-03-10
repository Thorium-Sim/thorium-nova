import {
  createContext,
  type 
  MutableRefObject,
  type 
  ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";

export const EdgeContext = createContext<
  MutableRefObject<Set<(nodeId: number, x: number, y: number) => void>[]>
>(null!);

export const EdgeContextProvider = ({children}: {children: ReactNode}) => {
  const edgeRenderFunctions = useRef<
    Set<(nodeId: number, x: number, y: number) => void>[]
  >([]);

  return (
    <EdgeContext.Provider value={edgeRenderFunctions}>
      {children}
    </EdgeContext.Provider>
  );
};
export function useEdgeRerender(
  from: number,
  to: number,
  fn: (nodeId: number, x: number, y: number) => void
) {
  const callback = useRef(fn);
  useEffect(() => {
    callback.current = fn;
  }, [fn]);
  const edgeRenderFunctions = useContext(EdgeContext);
  useEffect(() => {
    const rerender = callback.current;
    const functions = edgeRenderFunctions.current;
    if (!functions[from]) {
      functions[from] = new Set();
    }
    if (!functions[to]) {
      functions[to] = new Set();
    }
    functions[from].add(rerender);
    functions[to].add(rerender);
    return () => {
      functions[from].delete(rerender);
      functions[to].delete(rerender);
    };
  }, [from, to, edgeRenderFunctions]);
}
export function useTriggerEdgeRender(nodeId: number) {
  const edgeRenderFunctions = useContext(EdgeContext);

  return (x: number, y: number) => {
    if (edgeRenderFunctions.current[nodeId]) {
      edgeRenderFunctions.current[nodeId].forEach(f => f(nodeId, x, y));
    }
  };
}
