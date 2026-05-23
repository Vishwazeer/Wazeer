import { Chess } from "chess.js";

export interface RoomMove {
  from: string;
  to: string;
  promotion?: string;
  san: string;
}

export interface RoomState {
  code: string;
  fen: string;
  moves: RoomMove[];
  whiteJoined: boolean;
  blackJoined: boolean;
  activeColor: "w" | "b";
  isGameOver: boolean;
  result: string | null;
  lastMove: { from: string; to: string } | null;
  timeControl: string;
  whiteTime: number;
  blackTime: number;
  lastUpdated: number;
}

// Persist the rooms Map across Next.js development hot-reloads
const globalForRooms = global as unknown as { rooms: Map<string, RoomState> };
export const rooms = globalForRooms.rooms || new Map<string, RoomState>();
if (process.env.NODE_ENV !== "production") globalForRooms.rooms = rooms;
