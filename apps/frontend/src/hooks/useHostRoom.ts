import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { playSoundEffect } from "@/lib/audio";
import { RoomState, SocketEvents } from "@party-games/shared";

export function useHostRoom() {
  const [room, setRoom] = useState<RoomState | null>(null);

  useEffect(() => {
    // 1. Si el socket ya estaba conectado al momento de cargar la página del host,
    // pedimos crear la sala inmediatamente.
    if (socket.connected) {
      socket.emit(SocketEvents.CREATE_ROOM);
    }

    // 2. Definimos los manejadores de eventos
    const onConnect = () => {
      socket.emit(SocketEvents.CREATE_ROOM);
    };

    const onRoomUpdated = (data: { room: RoomState }) => {
      setRoom(data.room);
    };

    const onPlaySound = (data: { sound: string }) => {
      playSoundEffect(data.sound);
    };

    // 3. Nos suscribimos a los eventos del socket
    socket.on("connect", onConnect);
    socket.on(SocketEvents.ROOM_UPDATED, onRoomUpdated);
    socket.on(SocketEvents.PLAY_SOUND, onPlaySound);

    // 4. Limpiamos los eventos al desmontar para evitar duplicados
    return () => {
      socket.off("connect", onConnect);
      socket.off(SocketEvents.ROOM_UPDATED, onRoomUpdated);
      socket.off(SocketEvents.PLAY_SOUND, onPlaySound);
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