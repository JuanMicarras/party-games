"use client";

import { useHostRoom } from "@/hooks/useHostRoom";
import { HostLobby } from "@/components/host/HostLobby";
import { HostBoard } from "@/components/host/HostBoard";
import { HostVictory } from "@/components/host/HostVictory";
import { CuentoChinoHostBoard } from "@/components/host/cuento-chino/CuentoChinoHostBoard";
import { CuentoChinoVictory } from "@/components/host/cuento-chino/CuentoChinoVictory";

export default function HostPage() {
  const { room, startGame, resetToLobby, nextQuestion } = useHostRoom();

  if (!room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <h1 className="text-2xl animate-pulse">Creando sala...</h1>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 text-white">
      {/* LOBBY */}
      {room.mode === "LOBBY" && (
        <HostLobby room={room} onStartGame={startGame} />
      )}

      {/* MIMIRETO */}
      {room.mode === "MIMIRETO" && room.mimireto?.status !== "FINISHED" && (
        <HostBoard room={room} onResetToLobby={resetToLobby} />
      )}

      {room.mode === "MIMIRETO" && room.mimireto?.status === "FINISHED" && (
        <HostVictory mimireto={room.mimireto} onResetToLobby={resetToLobby} />
      )}

      {/* CUENTO CHINO */}
      {room.mode === "CUENTO_CHINO" &&
        room.cuentoChino?.status !== "FINISHED" && (
          <CuentoChinoHostBoard
            room={room}
            onNextQuestion={nextQuestion}
            onResetToLobby={resetToLobby}
          />
        )}

      {room.mode === "CUENTO_CHINO" &&
        room.cuentoChino?.status === "FINISHED" && (
          <CuentoChinoVictory room={room} onResetToLobby={resetToLobby} />
        )}
    </main>
  );
}