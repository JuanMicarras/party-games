import { useEffect, useState, useRef } from "react";
import { socket } from "@/lib/socket";
import {
  RoomState,
  SocketEvents,
  JoinRoomPayload,
  LieFeedbackPayload,
} from "@party-games/shared";

export function useGameRoom() {
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [lieFeedback, setLieFeedback] = useState<LieFeedbackPayload | null>(null);
  const lastJoinedRef = useRef<JoinRoomPayload | null>(null);
  const lastQuestionIndexRef = useRef<number>(-1);

  useEffect(() => {
    setIsConnected(socket.connected);

    const onConnect = () => {
      setIsConnected(true);
      if (lastJoinedRef.current) {
        socket.emit(SocketEvents.JOIN_ROOM, lastJoinedRef.current);
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onRoomUpdated = (data: { room: RoomState }) => {
      setRoom(data.room);

      // Limpiar feedback de mentira si cambió la pregunta
      if (
        data.room.cuentoChino &&
        data.room.cuentoChino.currentQuestionIndex !==
          lastQuestionIndexRef.current
      ) {
        lastQuestionIndexRef.current =
          data.room.cuentoChino.currentQuestionIndex;
        setLieFeedback(null);
      }
    };

    const onLieFeedback = (data: LieFeedbackPayload) => {
      setLieFeedback(data);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(SocketEvents.ROOM_UPDATED, onRoomUpdated);
    socket.on(SocketEvents.LIE_FEEDBACK, onLieFeedback);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(SocketEvents.ROOM_UPDATED, onRoomUpdated);
      socket.off(SocketEvents.LIE_FEEDBACK, onLieFeedback);
    };
  }, []);

  const joinRoom = (payload: JoinRoomPayload) => {
    lastJoinedRef.current = payload;
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

  const submitLie = (roomCode: string, lie: string) => {
    socket.emit(SocketEvents.SUBMIT_LIE, { roomCode, lie });
  };

  const submitVote = (roomCode: string, optionId: string) => {
    socket.emit(SocketEvents.SUBMIT_VOTE, { roomCode, optionId });
  };

  const leaveRoom = () => {
    lastJoinedRef.current = null;
    setLieFeedback(null);
    setRoom(null);
  };

  return {
    isConnected,
    room,
    lieFeedback,
    joinRoom,
    emitCardAction,
    startTurn,
    submitLie,
    submitVote,
    leaveRoom,
  };
}
