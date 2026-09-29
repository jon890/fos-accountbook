"use client";

import { createContext, ReactNode, useContext } from "react";

interface TimeZoneContextValue {
  timezone: string;
}

const TimeZoneContext = createContext<TimeZoneContextValue | null>(null);

interface TimeZoneProviderProps {
  children: ReactNode;
  timezone?: string;
}

export function TimeZoneProvider({
  children,
  timezone = "Asia/Seoul",
}: TimeZoneProviderProps) {
  return (
    <TimeZoneContext.Provider value={{ timezone }}>
      {children}
    </TimeZoneContext.Provider>
  );
}

export function useTimeZone() {
  const context = useContext(TimeZoneContext);

  if (!context) {
    // Fallback: 브라우저의 시간대 사용
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return { timezone: browserTimezone || "Asia/Seoul" };
  }

  return context;
}
