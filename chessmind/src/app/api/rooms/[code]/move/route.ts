import { NextResponse } from "next/server";
import { rooms } from "@/lib/roomsStore";
import { Chess } from "chess.js";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const resolvedParams = await params;
    const { code } = resolvedParams;
    const body = await req.json();
    const { from, to, promotion, whiteTime, blackTime } = body;

    const room = rooms.get(code);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.isGameOver) {
      return NextResponse.json({ error: "Game is already over" }, { status: 400 });
    }

    // Play the move on the server
    const chess = new Chess(room.fen);
    const move = chess.move({ from, to, promotion: promotion || "q" });

    if (!move) {
      return NextResponse.json({ error: "Invalid move" }, { status: 400 });
    }

    // Update room details
    room.fen = chess.fen();
    room.lastMove = { from, to };
    room.activeColor = chess.turn();
    room.isGameOver = chess.isGameOver();
    
    let result: string | null = null;
    if (chess.isCheckmate()) {
      result = chess.turn() === "w" ? "0-1" : "1-0";
    } else if (chess.isDraw()) {
      result = "½-½";
    } else if (chess.isStalemate()) {
      result = "½-½ Stalemate";
    }
    room.result = result;

    // Append move to server move history
    room.moves.push({
      from,
      to,
      promotion,
      san: move.san,
    });

    // Update clocks if provided
    if (whiteTime !== undefined) room.whiteTime = whiteTime;
    if (blackTime !== undefined) room.blackTime = blackTime;

    room.lastUpdated = Date.now();
    rooms.set(code, room);

    return NextResponse.json(room);
  } catch (err) {
    return NextResponse.json({ error: "Failed to play move" }, { status: 500 });
  }
}
