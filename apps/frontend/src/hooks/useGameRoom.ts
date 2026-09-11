import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { RoomState, SocketEvents, JoinRoomPayload } from "@party-games/shared";

export function useGameRoom() {
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<RoomState | null>(null);

  useEffect(() => {
    // 2. Por si acaso se conectó en los milisegundos entre la línea de arriba y esta
    setIsConnected(socket.connected);
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => {
      setIsConnected(false);
      setRoom(null);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(SocketEvents.ROOM_UPDATED, (data) => setRoom(data.room));

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
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
