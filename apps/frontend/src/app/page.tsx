"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  SocketEvents,
  type JoinRoomPayload,
  type RoomUpdatedPayload,
  type RoomState,
} from "@party-games/shared";

let socket: Socket;

export default function Home() {
  const [roomCode, setRoomCode] = useState("ABCD");
  const [playerName, setPlayerName] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<RoomState | null>(null);

  useEffect(() => {
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    socket = io(backendUrl);

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setRoom(null);
    });

    socket.on(SocketEvents.ROOM_UPDATED, (data: RoomUpdatedPayload) => {
      setRoom(data.room);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoin = () => {
    if (!playerName.trim()) return;

    const payload: JoinRoomPayload = {
      roomCode: roomCode.toUpperCase(),
      playerName: playerName.trim(),
    };

    socket.emit(SocketEvents.JOIN_ROOM, payload);
  };

  const emitCardAction = (action: "SUCCESS" | "PASS" | "FOUL") => {
    if (room) {
      socket.emit(SocketEvents.CARD_ACTION, {
        roomCode: room.roomCode,
        action,
      });
    }
  };

  const startTurn = () => {
    if (room) {
      socket.emit(SocketEvents.START_TURN, { roomCode: room.roomCode });
    }
  };

  const currentPlayer = room?.players.find((p) => p.id === socket?.id);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-900 text-white">
      <div className="w-full max-w-md p-6 bg-slate-800 rounded-2xl shadow-xl border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold tracking-tight">Mimireto Mobile</h1>
          <span
            className={`h-3 w-3 rounded-full ${
              isConnected
                ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                : "bg-red-500"
            }`}
          />
        </div>

        {/* 1. VISTA DE INGRESO (FORMULARIO) */}
        {!room ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">
                Código de Sala
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 text-center font-mono uppercase text-2xl tracking-widest"
                maxLength={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">
                Tu Nombre
              </label>
              <input
                type="text"
                placeholder="Ingresa tu nombre"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 text-lg"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={!isConnected}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-bold text-lg transition cursor-pointer shadow-lg"
            >
              Unirse a la Sala
            </button>
          </div>
        ) : (
          /* 2. SI YA ESTÁ EN SALA */
          <div className="space-y-4">
            {/* ESTADO LOBBY */}
            {room.mode === "LOBBY" && (
              <div className="space-y-4">
                <div className="text-center p-6 bg-slate-950 rounded-xl border border-slate-700">
                  <p className="text-sm text-slate-400">Estás en la sala</p>
                  <p className="text-5xl font-mono font-black text-emerald-400 my-3 tracking-widest">
                    {room.roomCode}
                  </p>
                  <p className="text-slate-300 text-sm animate-pulse">
                    Mira la pantalla del TV. Esperando a que empiece la
                    partida...
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-700">
                  <h2 className="text-xs uppercase font-semibold text-slate-400 mb-3 tracking-wider">
                    Jugadores conectados ({room.players.length})
                  </h2>
                  <ul className="space-y-2">
                    {room.players.map((player) => (
                      <li
                        key={player.id}
                        className="flex items-center justify-between text-sm bg-slate-800/80 px-3 py-2 rounded-lg"
                      >
                        <span className="font-medium">{player.name}</span>
                        {player.id === socket.id && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30">
                            Tú
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ESTADO MIMIRETO */}
            {room.mode === "MIMIRETO" && room.mimireto && (
              <div className="space-y-4">
                {/* Cabecera con el equipo asignado */}
                <div
                  className={`p-2.5 text-center font-bold rounded-xl text-lg ${
                    currentPlayer?.team === "A"
                      ? "bg-rose-950/60 text-rose-300 border border-rose-700/60"
                      : currentPlayer?.team === "B"
                        ? "bg-sky-950/60 text-sky-300 border border-sky-700/60"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  Equipo {currentPlayer?.team ?? "Sin Asignar"}
                </div>

                {/* SI EL JUEGO TERMINÓ */}
                {room.mimireto.status === "FINISHED" ? (
                  <div className="text-center p-8 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl">
                    <span className="text-6xl animate-bounce inline-block">
                      🏆
                    </span>
                    <p className="mt-6 font-bold text-2xl text-amber-400">
                      ¡Partida Finalizada!
                    </p>
                    <p className="text-slate-400 mt-2 text-sm">
                      Mira los resultados en la pantalla principal.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* ROL 1: ERES EL ORADOR */}
                    {room.mimireto.speakerId === socket?.id &&
                      room.mimireto.currentCard && (
                        <div className="bg-emerald-900/30 border-2 border-emerald-500 rounded-xl p-6 text-center shadow-lg">
                          <p className="text-emerald-400 font-bold mb-1">
                            ¡ES TU TURNO!
                          </p>

                          {/* Botón de Iniciar / Reanudar */}
                          {room.mimireto.status === "WAITING" ||
                          room.mimireto.status === "TIME_UP" ||
                          room.mimireto.status === "PAUSED" ? (
                            <div className="mt-8 space-y-4">
                              <p className="text-slate-300">
                                {room.mimireto.status === "PAUSED"
                                  ? "Juego en pausa."
                                  : "Asegúrate de que todos estén listos."}
                              </p>
                              <button
                                onClick={startTurn}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-2xl rounded-xl shadow-[0_4px_0_rgb(4,120,87)] active:translate-y-1 transition-all"
                              >
                                {room.mimireto.status === "PAUSED"
                                  ? "¡Reanudar Reloj!"
                                  : "¡Iniciar Reloj!"}
                              </button>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-slate-300 mb-4">
                                Haz que tu equipo adivine:
                              </p>
                              <h2 className="text-4xl font-black text-white mb-6 uppercase tracking-wider">
                                {room.mimireto.currentCard.word}
                              </h2>

                              {/* Palabras Prohibidas con lectura limpia */}
                              <div className="bg-red-950/40 border border-red-900/60 p-4 rounded-xl text-left">
                                <p className="text-red-400 font-bold text-xs mb-3 tracking-wider uppercase text-center">
                                  Palabras Prohibidas
                                </p>
                                <div className="flex flex-col gap-2">
                                  {room.mimireto.currentCard.forbidden.map(
                                    (word, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between px-3 py-2 bg-red-900/20 border border-red-500/20 rounded-lg"
                                      >
                                        <span className="text-base font-semibold text-red-200">
                                          {word}
                                        </span>
                                        <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">
                                          ✕
                                        </span>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-4 mt-6">
                                <button
                                  onClick={() => emitCardAction("PASS")}
                                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition cursor-pointer"
                                >
                                  Pasar
                                </button>
                                <button
                                  onClick={() => emitCardAction("SUCCESS")}
                                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-[0_4px_0_rgb(4,120,87)] active:translate-y-1 active:shadow-none transition cursor-pointer"
                                >
                                  +1 Acierto
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                    {/* ROL 2: ERES EL JUEZ */}
                    {room.mimireto.judgeId === socket?.id &&
                      room.mimireto.currentCard && (
                        <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-6 text-center shadow-lg">
                          <p className="text-red-400 font-bold mb-1">
                            ERES EL JUEZ
                          </p>
                          <p className="text-sm text-slate-300 mb-4">
                            Vigila que no diga:
                          </p>
                          <h2 className="text-2xl font-bold text-slate-400 mb-4">
                            {room.mimireto.currentCard.word}
                          </h2>

                          <div className="flex flex-col gap-2 mb-8 text-left">
                            {room.mimireto.currentCard.forbidden.map(
                              (word, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between px-3 py-2 bg-red-950/60 border border-red-800/50 rounded-lg"
                                >
                                  <span className="text-lg font-bold text-red-400">
                                    {word}
                                  </span>
                                  <span className="text-xs font-bold text-red-500 bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/40">
                                    ✕
                                  </span>
                                </div>
                              ),
                            )}
                          </div>

                          <button
                            onClick={() => emitCardAction("FOUL")}
                            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-2xl rounded-xl shadow-[0_4px_0_rgb(153,27,27)] active:shadow-[0_0px_0_rgb(153,27,27)] active:translate-y-1 transition-all cursor-pointer"
                          >
                            ¡FALTA!
                          </button>
                        </div>
                      )}

                    {/* ROL 3: ESPECTADOR / ADIVINADOR */}
                    {room.mimireto.speakerId !== socket?.id &&
                      room.mimireto.judgeId !== socket?.id && (
                        <div className="text-center p-8 bg-slate-950 rounded-2xl border border-slate-800">
                          <div className="text-5xl animate-bounce mb-4">🤔</div>
                          <p className="font-bold text-xl text-amber-400">
                            ¡Adivina la palabra!
                          </p>
                          <p className="text-slate-400 text-sm mt-2">
                            Escucha con atención las pistas de tu orador y no te
                            dejes penalizar.
                          </p>
                        </div>
                      )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
