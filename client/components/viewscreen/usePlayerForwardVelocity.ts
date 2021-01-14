import {usePlayerForwardVelocitySubscription} from "client/generated/graphql";
import {lerp} from "client/helpers/lerp";
import useAnimationFrame from "client/helpers/unused/useAnimationFrame";
import {useEffect, useRef} from "react";
import {singletonHook} from "react-singleton-hook";
import create from "zustand";

export const useForwardVelocityStore = create<{forwardVelocity: number}>(
  () => ({forwardVelocity: 0})
);
export const usePlayerForwardVelocity = singletonHook(
  null,
  function usePlayerForwardVelocity() {
    const {data: velocityData} = usePlayerForwardVelocitySubscription();
    const ship = velocityData?.playerShipHot;
    const forwardVelocity = ship?.forwardVelocity || 0;

    const prevForwardVelocity = useRef(forwardVelocity);
    const timeStamp = useRef(Date.now());
    const timeIntervals = useRef([1]);
    const averageInterval = useRef(1000 / 30);

    useAnimationFrame(() => {
      const t = Math.min(
        1,
        (Date.now() - timeStamp.current) / averageInterval.current
      );
      useForwardVelocityStore.setState(() => ({
        forwardVelocity: lerp(prevForwardVelocity.current, forwardVelocity, t),
      }));
    });
    useEffect(() => {
      prevForwardVelocity.current = useForwardVelocityStore.getState().forwardVelocity;
      timeIntervals.current.unshift(Date.now() - timeStamp.current);
      timeIntervals.current = timeIntervals.current.slice(0, 20);
      averageInterval.current = timeIntervals.current.reduce(
        (prev, next, i, arr) => prev + next / arr.length,
        0
      );
      timeStamp.current = Date.now();
    }, [forwardVelocity]);
    return null;
  }
);
