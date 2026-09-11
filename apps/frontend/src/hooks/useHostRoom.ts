import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { playSoundEffect } from "@/lib/audio";
import { RoomState, SocketEvents, GameMode } from "@party-games/shared";

export function useHostRoom() {
  const [room, setRoom] = useState<RoomState | null>(null);

  useEffect(() => {
    if (socket.connected) {
      socket.emit(SocketEvents.CREATE_ROOM);
    }

    const onConnect = () => {
      socket.emit(SocketEvents.CREATE_ROOM);
    };

    const onRoomUpdated = (data: { room: RoomState }) => {
      setRoom(data.room);
    };

    const onPlaySound = (data: { sound: string }) => {
      playSoundEffect(data.sound);
    };

    socket.on("connect", onConnect);
    socket.on(SocketEvents.ROOM_UPDATED, onRoomUpdated);
    socket.on(SocketEvents.PLAY_SOUND, onPlaySound);

    return () => {
      socket.off("connect", onConnect);
      socket.off(SocketEvents.ROOM_UPDATED, onRoomUpdated);
      socket.off(SocketEvents.PLAY_SOUND, onPlaySound);
    };
  }, []);

  const startGame = (
    gameMode: GameMode = "MIMIRETO",
    options?: { roundsMultiplier?: number; totalQuestions?: number },
  ) => {
    if (room && room.players.length >= 2) {
      socket.emit(SocketEvents.START_GAME, {
        roomCode: room.roomCode,
        gameMode,
        roundsMultiplier: options?.roundsMultiplier ?? 1,
        totalQuestions: options?.totalQuestions ?? 3,
      });
    }
  };

  const nextQuestion = () => {
    if (room) {
      socket.emit(SocketEvents.NEXT_QUESTION, { roomCode: room.roomCode });
    }
  };

  const resetToLobby = () => {
    if (room) {
      socket.emit(SocketEvents.RESET_TO_LOBBY, {
        roomCode: room.roomCode,
      });
    }
  };

  return { room, startGame, resetToLobby, nextQuestion };
}