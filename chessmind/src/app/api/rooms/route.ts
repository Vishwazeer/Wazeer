import { NextResponse } from "next/server";
import { rooms, RoomState } from "@/lib/roomsStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { playerColor, timeControlLabel, timeControlSeconds } = body;

    // Generate unique 6-digit code
    let code = "";
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (rooms.has(code));

    // Resolve color
    let assignedColor: "w" | "b" = "w";
    if (playerColor === "b") {
      assignedColor = "b";
    } else if (playerColor === "random") {
      assignedColor = Math.random() < 0.5 ? "w" : "b";
    }

    const initialRoomState: RoomState = {
      code,
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      moves: [],
      whiteJoined: assignedColor === "w",
      blackJoined: assignedColor === "b",
      activeColor: "w",
      isGameOver: false,
      result: null,
      lastMove: null,
      timeControl: timeControlLabel || "5+3 Blitz",
      whiteTime: timeControlSeconds || 300,
      blackTime: timeControlSeconds || 300,
      lastUpdated: Date.now(),
    };

    rooms.set(code, initialRoomState);

    return NextResponse.json({ code, playerColor: assignedColor });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
