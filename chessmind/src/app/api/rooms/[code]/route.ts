import { NextResponse } from "next/server";
import { rooms } from "@/lib/roomsStore";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const resolvedParams = await params;
    const { code } = resolvedParams;
    const room = rooms.get(code);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Dynamic timer/clock decrement logic for the active player
    if (room.whiteJoined && room.blackJoined && !room.isGameOver && room.timeControl !== "∞ Untimed") {
      const elapsedSeconds = Math.floor((Date.now() - room.lastUpdated) / 1000);
      if (elapsedSeconds > 0) {
        if (room.activeColor === "w") {
          room.whiteTime = Math.max(0, room.whiteTime - elapsedSeconds);
          if (room.whiteTime === 0) {
            room.isGameOver = true;
            room.result = "0-1";
          }
        } else {
          room.blackTime = Math.max(0, room.blackTime - elapsedSeconds);
          if (room.blackTime === 0) {
            room.isGameOver = true;
            room.result = "1-0";
          }
        }
        room.lastUpdated = Date.now();
        rooms.set(code, room);
      }
    }

    return NextResponse.json(room);
  } catch (err) {
    return NextResponse.json({ error: "Failed to get room state" }, { status: 500 });
  }
}
