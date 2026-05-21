"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";

function formatTime(seconds: number): string {
  if (seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface ClockProps {
  color: "w" | "b";
  isTop?: boolean;
}

function Clock({ color, isTop = false }: ClockProps) {
  const time = useGameStore((s) => (color === "w" ? s.whiteTime : s.blackTime));
  const activeColor = useGameStore((s) => s.activeColor);
  const clockRunning = useGameStore((s) => s.clockRunning);
  const timeControl = useGameStore((s) => s.timeControl);

  const isActive = activeColor === color && clockRunning;
  const isLow = time <= 30 && time > 0;
  const isCritical = time <= 10 && time > 0;
  const isUntimed = timeControl.time === 0;

  if (isUntimed) return null;

  return (
    <div
      className={`
        flex items-center justify-between px-5 py-3 rounded-xl
        font-mono text-xl font-bold transition-all duration-300
        ${isTop ? "mb-3" : "mt-3"}
        ${
          isActive
            ? "bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-[var(--color-text)]"
            : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]"
        }
        ${isCritical ? "!bg-[var(--color-red)]/10 !border-[var(--color-red)]/30 !text-[var(--color-red)]" : ""}
        ${isLow && !isCritical ? "!bg-[var(--color-amber)]/10 !border-[var(--color-amber)]/30 !text-[var(--color-amber)]" : ""}
      `}
    >
      <span className="text-sm font-sans font-medium text-[var(--color-text-dim)]">
        {color === "w" ? "White" : "Black"}
      </span>
      <span className={isCritical ? "animate-pulse" : ""}>
        {formatTime(time)}
      </span>
    </div>
  );
}

export default function ChessClock() {
  const clockRunning = useGameStore((s) => s.clockRunning);
  const activeColor = useGameStore((s) => s.activeColor);
  const tickClock = useGameStore((s) => s.tickClock);
  const boardFlipped = useGameStore((s) => s.boardFlipped);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (clockRunning) {
      intervalRef.current = setInterval(() => {
        tickClock(activeColor);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [clockRunning, activeColor, tickClock]);

  const topColor = boardFlipped ? "w" : "b";
  const bottomColor = boardFlipped ? "b" : "w";

  return (
    <>
      <Clock color={topColor} isTop />
      <Clock color={bottomColor} />
    </>
  );
}
