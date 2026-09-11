"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  SocketEvents,
  type RoomUpdatedPayload,
  type RoomState,
} from "@party-games/shared";

let socket: Socket;

export default function HostPage() {
  const [room, setRoom] = useState<RoomState | null>(null);

  useEffect(() => {
    socket = io("http://localhost:4000");

    socket.on("connect", () => {
      // Apenas se conecta el TV/Host, pide crear una sala nueva
      socket.emit(SocketEvents.CREATE_ROOM);
    });

    socket.on(SocketEvents.ROOM_UPDATED, (data: RoomUpdatedPayload) => {
      setRoom(data.room);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleStartGame = () => {
    if (room && room.players.length >= 2) {
      socket.emit(SocketEvents.START_GAME, { roomCode: room.roomCode });
    }
  };

  if (!room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <h1 className="text-2xl animate-pulse">Creando sala...</h1>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 text-white">
      {/* VISTA 1: EL LOBBY */}
      {room.mode === "LOBBY" && (
        <div className="text-center space-y-8">
          <h1 className="text-3xl font-bold text-slate-400">
            Únete en tu celular
          </h1>
          <div className="bg-slate-800 p-8 rounded-3xl border-4 border-slate-700 shadow-2xl">
            <p className="text-8xl font-mono font-black tracking-widest text-emerald-400">
              {room.roomCode}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center max-w-2xl mt-8">
            {room.players.map((player) => (
              <span
                key={player.id}
                className="px-4 py-2 bg-blue-600 rounded-full font-semibold shadow-lg text-lg"
              >
                {player.name}
              </span>
            ))}
          </div>

          {room.players.length >= 2 && (
            <button
              onClick={handleStartGame}
              className="mt-8 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-2xl"
            >
              ¡Empezar Juego!
            </button>
          )}
        </div>
      )}

      {/* VISTA 2: EL TABLERO DE MIMIRETO */}
      {room.mode === "MIMIRETO" && room.mimireto && (
        <div className="text-center w-full max-w-4xl space-y-8">
          <h1 className="text-5xl font-black text-amber-400 mb-12">MIMIRETO</h1>

          <div className="flex justify-between items-center bg-slate-800 p-8 rounded-3xl border border-slate-700">
            {/* Marcador Equipo A */}
            <div className="text-center">
              <h2 className="text-2xl text-blue-400 font-bold mb-2">
                EQUIPO A
              </h2>
              <p className="text-6xl font-black">{room.mimireto.teamAScore}</p>
            </div>

            {/* Centro: Estado del turno y RELOJ */}
            <div className="flex flex-col items-center justify-center space-y-4 px-8 min-w-[300px]">
              {room.mimireto.status === "TIME_UP" ? (
                <div className="animate-bounce bg-red-600 px-6 py-2 rounded-full mb-4">
                  <span className="text-2xl font-bold text-white">
                    ¡TIEMPO!
                  </span>
                </div>
              ) : (
                <div className="text-xl text-slate-300">
                  Turno del Equipo{" "}
                  <span className="font-bold text-amber-400">
                    {room.mimireto.currentTurn}
                  </span>
                </div>
              )}

              {/* El Reloj Gigante */}
              <div
                className={`text-8xl font-black font-mono tabular-nums ${
                  room.mimireto.timeLeft <= 10
                    ? "text-red-500 animate-pulse"
                    : "text-emerald-400"
                }`}
              >
                00:{room.mimireto.timeLeft.toString().padStart(2, "0")}
              </div>

              <div className="mt-4">
                <div className="text-2xl font-bold text-slate-200">
                  Orador:{" "}
                  {
                    room.players.find((p) => p.id === room.mimireto?.speakerId)
                      ?.name
                  }
                </div>
                <div className="text-lg text-rose-400 mt-1">
                  Juez:{" "}
                  {
                    room.players.find((p) => p.id === room.mimireto?.judgeId)
                      ?.name
                  }
                </div>
              </div>
            </div>

            {/* Marcador Equipo B */}
            <div className="text-center">
              <h2 className="text-2xl text-rose-400 font-bold mb-2">
                EQUIPO B
              </h2>
              <p className="text-6xl font-black">{room.mimireto.teamBScore}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
