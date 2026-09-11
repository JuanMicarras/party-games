"use client";
import { useState } from "react";
import { useGameRoom } from "@/hooks/useGameRoom";
import { JoinForm } from "@/components/player/JoinForm";
import { PlayerLobby } from "@/components/player/PlayerLobby";
import { SpeakerView } from "@/components/player/SpeakerView";
import { JudgeView } from "@/components/player/JudgeView";
import { GuesserView } from "@/components/player/GuesserView";
import { GameFinished } from "@/components/player/GameFinished";
import { socket } from "@/lib/socket";
import { TeamBanner } from "../components/player/TeamBanner";

export default function Home() {
  const { isConnected, room, joinRoom, emitCardAction, startTurn } =
    useGameRoom();

  if (!room) {
    return <JoinForm isConnected={isConnected} onJoin={joinRoom} />;
  }

  if (room.mode === "LOBBY") {
    return <PlayerLobby room={room} socketId={socket.id} />;
  }

  if (room.mimireto?.status === "FINISHED") {
    return <GameFinished />;
  }

  // Lógica de asignación de roles
  const isSpeaker = room.mimireto?.speakerId === socket.id;
  const isJudge = room.mimireto?.judgeId === socket.id;
  const currentPlayer = room.players.find((p) => p.id === socket.id);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-900 text-white">
      <div className="w-full max-w-md p-6 bg-slate-800 rounded-2xl shadow-xl border border-slate-700">
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
      </div>
    </main>
  );
}
