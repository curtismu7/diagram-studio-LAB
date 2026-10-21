import { useEffect, useReducer } from "react";
import { initial, reduce, speedMs } from "@diagram-studio/core";

/** Timer wrapper around the pure stepper reducer: ticks while a walkthrough is playing. */
export function useStepper(total) {
  const [s, dispatch] = useReducer(reduce, total, initial);
  useEffect(() => { dispatch({ type: "total", total }); }, [total]);
  useEffect(() => {
    if (s.step < 0 || s.paused) return undefined;
    const id = setTimeout(() => dispatch({ type: "tick" }), speedMs(s.speed));
    return () => clearTimeout(id);
  }, [s.step, s.paused, s.speed]);
  return [s, dispatch];
}
