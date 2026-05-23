import { NextResponse } from "next/server";
import { rooms } from "@/lib/roomsStore";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const resolvedParams = await params;
    const { code } = resolvedParams;
    const room = rooms.get(code);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (err) {
    return NextResponse.json({ error: "Failed to get room state" }, { status: 500 });
  }
}
