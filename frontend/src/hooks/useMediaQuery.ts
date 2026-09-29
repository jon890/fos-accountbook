"use client";

import { useSyncExternalStore } from "react";

const subscribeCache = new Map<string, (callback: () => void) => () => void>();
const getSnapshotCache = new Map<string, () => boolean>();

function getSubscribe(query: string): (callback: () => void) => () => void {
  let subscribe = subscribeCache.get(query);
  if (!subscribe) {
    subscribe = (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    };
    subscribeCache.set(query, subscribe);
  }
  return subscribe;
}

function getSnapshotFn(query: string): () => boolean {
  let fn = getSnapshotCache.get(query);
  if (!fn) {
    fn = () => window.matchMedia(query).matches;
    getSnapshotCache.set(query, fn);
  }
  return fn;
}

const ssrFallback = () => false;

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(getSubscribe(query), getSnapshotFn(query), ssrFallback);
}
