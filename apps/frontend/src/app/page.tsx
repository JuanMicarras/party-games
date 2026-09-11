"use client";

import { useGameRoom } from "@/hooks/useGameRoom";
import { JoinForm } from "@/components/player/JoinForm";
import { PlayerLobby } from "@/components/player/PlayerLobby";
import { SpeakerView } from "@/components/player/SpeakerView";
import { JudgeView } from "@/components/player/JudgeView";
import { GuesserView } from "@/components/player/GuesserView";
import { GameFinished } from "@/components/player/GameFinished";
import { TeamBanner } from "@/components/player/TeamBanner";
import { socket } from "@/lib/socket";

export default function Home() {
  const { isConnected, room, joinRoom, emitCardAction, startTurn } = useGameRoom();

  const isSpeaker = room?.mimireto?.speakerId === socket.id;
  const isJudge = room?.mimireto?.judgeId === socket.id;
  const currentPlayer = room?.players.find((p) => p.id === socket.id);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-900 text-white">
      <div className="w-full max-w-md p-6 bg-slate-800 rounded-2xl shadow-xl border border-slate-700">
        
        {/* Cabecera persistente (Título + Nombre + Punto de conexión) */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Mimireto Mobile</h1>
            {/* Si el jugador ya está en la sala, mostramos su nombre */}
            {currentPlayer && (
              <p className="text-sm text-slate-400 font-medium mt-1">
                Jugador: <span className="text-blue-400 font-bold">{currentPlayer.name}</span>
              </p>
            )}
          </div>
          <span
            className={`h-3 w-3 rounded-full transition-all mt-1.5 ${
              isConnected
                ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                : "bg-red-500"
            }`}
          />
        </div>

        {/* Renderizado condicional de las vistas (SRP aplicado) */}
        {!room ? (
          <JoinForm isConnected={isConnected} onJoin={joinRoom} />
        ) : room.mode === "LOBBY" ? (
          <PlayerLobby room={room} socketId={socket.id} />
        ) : room.mimireto?.status === "FINISHED" ? (
          <GameFinished />
        ) : (
          <>
            <TeamBanner team={currentPlayer?.team} />
            {isSpeaker && (
              <SpeakerView
                room={room}
                onAction={(action) => emitCardAction(room.roomCode, action)}
                onStartTurn={() => startTurn(room.roomCode)}
              />
            )}
            {isJudge && (
              <JudgeView
                room={room}
                onAction={(action) => emitCardAction(room.roomCode, action)}
              />
            )}
            {!isSpeaker && !isJudge && <GuesserView />}
          </>
        )}

      </div>
    </main>
  );
}