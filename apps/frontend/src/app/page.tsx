"use client";

import { useGameRoom } from "@/hooks/useGameRoom";
import { JoinForm } from "@/components/player/JoinForm";
import { PlayerLobby } from "@/components/player/PlayerLobby";
import { SpeakerView } from "@/components/player/SpeakerView";
import { JudgeView } from "@/components/player/JudgeView";
import { GuesserView } from "@/components/player/GuesserView";
import { GameFinished } from "@/components/player/GameFinished";
import { TeamBanner } from "@/components/player/TeamBanner";
import { WriteLieView } from "@/components/player/cuento-chino/WriteLieView";
import { VoteView } from "@/components/player/cuento-chino/VoteView";
import { RoundResultView } from "@/components/player/cuento-chino/RoundResultView";
import { socket } from "@/lib/socket";

export default function Home() {
  const {
    isConnected,
    room,
    lieFeedback,
    joinRoom,
    emitCardAction,
    startTurn,
    submitLie,
    submitVote,
    leaveRoom,
  } = useGameRoom();

  const socketId = socket.id || "";
  const isSpeaker = room?.mimireto?.speakerId === socketId;
  const isJudge = room?.mimireto?.judgeId === socketId;
  const currentPlayer = room?.players.find((p) => p.id === socketId);

  const gameTitle =
    room?.mode === "CUENTO_CHINO"
      ? "Cuento Chino"
      : room?.mode === "MIMIRETO"
        ? "Mimireto"
        : "Party Games Mobile";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-900 text-white">
      <div className="w-full max-w-md p-6 bg-slate-800 rounded-2xl shadow-xl border border-slate-700">
        {/* Cabecera persistente */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{gameTitle}</h1>
            {currentPlayer && (
              <p className="text-sm text-slate-400 font-medium mt-1">
                Jugador:{" "}
                <span className="text-blue-400 font-bold">
                  {currentPlayer.name}
                </span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isConnected && room && (
              <span className="text-xs text-amber-400 animate-pulse font-medium">
                Reconectando...
              </span>
            )}
            <span
              className={`h-3 w-3 rounded-full transition-all mt-1.5 ${
                isConnected
                  ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                  : "bg-red-500"
              }`}
            />
          </div>
        </div>

        {/* Renderizado condicional de vistas */}
        {!room ? (
          <JoinForm isConnected={isConnected} onJoin={joinRoom} />
        ) : room.mode === "LOBBY" ? (
          <div className="space-y-4">
            <PlayerLobby room={room} socketId={socketId} />
            <button
              onClick={leaveRoom}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-rose-400 transition text-center cursor-pointer"
            >
              ← Salir de la sala
            </button>
          </div>
        ) : room.mode === "MIMIRETO" ? (
          room.mimireto?.status === "FINISHED" ? (
            <div className="space-y-4">
              <GameFinished />
              <button
                onClick={leaveRoom}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-rose-400 transition text-center cursor-pointer"
              >
                ← Salir de la sala
              </button>
            </div>
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
              {!isSpeaker && !isJudge && (
                <GuesserView status={room.mimireto?.status} />
              )}
            </>
          )
        ) : room.mode === "CUENTO_CHINO" && room.cuentoChino ? (
          room.cuentoChino.status === "FINISHED" ? (
            <div className="space-y-4">
              <GameFinished />
              <button
                onClick={leaveRoom}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-rose-400 transition text-center cursor-pointer"
              >
                ← Salir de la sala
              </button>
            </div>
          ) : room.cuentoChino.status === "WRITING_LIES" ? (
            <WriteLieView
              question={room.cuentoChino.currentQuestion!}
              onSubmitLie={(lie) => submitLie(room.roomCode, lie)}
              hasSubmitted={
                room.cuentoChino.submittedLies[socketId] !== undefined
              }
              isSabio={
                room.cuentoChino.sabioPlayerIds.includes(socketId) ||
                lieFeedback?.status === "SABIO"
              }
              feedbackMessage={lieFeedback?.message}
            />
          ) : room.cuentoChino.status === "VOTING" ? (
            <VoteView
              options={room.cuentoChino.options}
              onVote={(optionId) => submitVote(room.roomCode, optionId)}
              hasVoted={room.cuentoChino.votes[socketId] !== undefined}
              selectedOptionId={room.cuentoChino.votes[socketId]}
              currentUserId={socketId}
              isSabio={room.cuentoChino.sabioPlayerIds.includes(socketId)}
            />
          ) : room.cuentoChino.status === "REVEALING" ? (
            <RoundResultView
              roundEvents={room.cuentoChino.roundEvents}
              currentUserId={socketId}
              totalScore={room.cuentoChino.scores[socketId] || 0}
              isSabio={room.cuentoChino.sabioPlayerIds.includes(socketId)}
            />
          ) : null
        ) : null}
      </div>
    </main>
  );
}