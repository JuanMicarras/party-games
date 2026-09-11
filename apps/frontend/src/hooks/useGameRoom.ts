import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { RoomState, SocketEvents, JoinRoomPayload } from "@party-games/shared";

export function useGameRoom() {
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<RoomState | null>(null);

  useEffect(() => {
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => {
      setIsConnected(false);
      setRoom(null);
    });
    socket.on(SocketEvents.ROOM_UPDATED, (data) => setRoom(data.room));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off(SocketEvents.ROOM_UPDATED);
    };
  }, []);

  const joinRoom = (payload: JoinRoomPayload) => {
    socket.emit(SocketEvents.JOIN_ROOM, payload);
  };

  const emitCardAction = (
    roomCode: string,
    action: "SUCCESS" | "PASS" | "FOUL",
  ) => {
    socket.emit(SocketEvents.CARD_ACTION, { roomCode, action });
  };

  const startTurn = (roomCode: string) => {
    socket.emit(SocketEvents.START_TURN, { roomCode });
  };

  return { isConnected, room, joinRoom, emitCardAction, startTurn };
}
