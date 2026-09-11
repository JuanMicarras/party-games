"use client";

import { useHostRoom } from "@/hooks/useHostRoom";
import { HostLobby } from "@/components/host/HostLobby";
import { HostBoard } from "@/components/host/HostBoard";
import { HostVictory } from "@/components/host/HostVictory";

export default function HostPage() {
  const { room, startGame } = useHostRoom();

  if (!room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <h1 className="text-2xl animate-pulse">Creando sala...</h1>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 text-white">
      {room.mode === "LOBBY" && (
        <HostLobby room={room} onStartGame={startGame} />
      )}

      {room.mode === "MIMIRETO" && room.mimireto?.status !== "FINISHED" && (
        <HostBoard room={room} />
      )}

      {room.mode === "MIMIRETO" && room.mimireto?.status === "FINISHED" && (
        <HostVictory mimireto={room.mimireto} />
      )}
    </main>
  );
}