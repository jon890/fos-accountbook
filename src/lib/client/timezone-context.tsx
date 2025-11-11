"use client";

import { createContext, useContext, ReactNode } from "react";

interface TimeZoneContextValue {
  timezone: string;
}

const TimeZoneContext = createContext<TimeZoneContextValue | null>(null);

interface TimeZoneProviderProps {
  timezone: string;
  children: ReactNode;
}

export function TimeZoneProvider({
  timezone,
  children,
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
