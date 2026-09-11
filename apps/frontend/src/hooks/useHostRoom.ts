import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { playSoundEffect } from "@/lib/audio"; // El archivo que creamos en el paso anterior
import { RoomState, SocketEvents } from "@party-games/shared";

export function useHostRoom() {
  const [room, setRoom] = useState<RoomState | null>(null);

  useEffect(() => {
    socket.on("connect", () => {
      socket.emit(SocketEvents.CREATE_ROOM);
    });

    socket.on(SocketEvents.ROOM_UPDATED, (data) => {
      setRoom(data.room);
    });

    socket.on(SocketEvents.PLAY_SOUND, (data: { sound: string }) => {
      playSoundEffect(data.sound);
    });

    return () => {
      socket.off("connect");
      socket.off(SocketEvents.ROOM_UPDATED);
      socket.off(SocketEvents.PLAY_SOUND);
    };
  }, []);

  const startGame = (multiplier: number) => {
    if (room && room.players.length >= 2) {
      socket.emit(SocketEvents.START_GAME, {
        roomCode: room.roomCode,
        roundsMultiplier: multiplier,
      });
    }
  };

  return { room, startGame };
}
