import { NextResponse } from "next/server";
import { rooms } from "@/lib/roomsStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code } = body;
    const cleanCode = code?.trim();

    const room = rooms.get(cleanCode);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.whiteJoined && room.blackJoined) {
      return NextResponse.json({ error: "Room is already full" }, { status: 400 });
    }

    let guestColor: "w" | "b";
    if (room.whiteJoined) {
      room.blackJoined = true;
      guestColor = "b";
    } else {
      room.whiteJoined = true;
      guestColor = "w";
    }

    room.lastUpdated = Date.now();
    rooms.set(cleanCode, room);

    return NextResponse.json({
      code: room.code,
      playerColor: guestColor,
      timeControl: room.timeControl,
      whiteTime: room.whiteTime,
      blackTime: room.blackTime,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}
