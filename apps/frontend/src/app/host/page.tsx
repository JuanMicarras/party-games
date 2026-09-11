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
  const [multiplier, setMultiplier] = useState<number>(1); // 1 = Rápida, 2 = Estándar

  useEffect(() => {
    socket = io("http://localhost:4000");

    socket.on("connect", () => {
      // Apenas se conecta el TV/Host, pide crear una sala nueva
      socket.emit(SocketEvents.CREATE_ROOM);
    });

    socket.on(SocketEvents.ROOM_UPDATED, (data: RoomUpdatedPayload) => {
      setRoom(data.room);
    });
    
    // NUEVO: Escuchador de sonidos
    socket.on(SocketEvents.PLAY_SOUND, (data: { sound: string }) => {
      let audioUrl = '';
      switch (data.sound) {
        case 'SUCCESS':
          audioUrl = 'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg'; // Ding
          break;
        case 'FOUL':
          audioUrl = 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg'; 
          break;
        case 'TICK':
          audioUrl = 'https://actions.google.com/sounds/v1/ui/button_click.ogg'; 
          break;
        case 'TIME_UP':
          audioUrl = 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg'; // Alarma final
          break;
      }

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        // Bajamos un poco el volumen del tick para que no aturda
        if (data.sound === 'TICK') audio.volume = 0.3;
        audio.play().catch((err) => console.log('Bloqueado por el navegador', err));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleStartGame = () => {
    if (room && room.players.length >= 2) {
      socket.emit(SocketEvents.START_GAME, {
        roomCode: room.roomCode,
        roundsMultiplier: multiplier,
      });
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

          {/* Selector de Rondas y Botón de Inicio */}
          {room.players.length >= 2 && (
            <div className="mt-8 flex flex-col items-center gap-5">
              <div className="flex gap-3 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner">
                <button
                  type="button"
                  onClick={() => setMultiplier(1)}
                  className={`px-6 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                    multiplier === 1
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  ⚡ Partida Rápida (1x)
                </button>
                <button
                  type="button"
                  onClick={() => setMultiplier(2)}
                  className={`px-6 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                    multiplier === 2
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  🎯 Partida Estándar (2x)
                </button>
              </div>

              <button
                type="button"
                onClick={handleStartGame}
                className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-2xl transition transform hover:scale-105 shadow-xl cursor-pointer"
              >
                ¡Empezar Juego!
              </button>
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: EL TABLERO DE MIMIRETO (JUEGO EN CURSO) */}
      {room.mode === "MIMIRETO" &&
        room.mimireto &&
        room.mimireto.status !== "FINISHED" && (
          <div className="text-center w-full max-w-4xl space-y-8">
            <h1 className="text-5xl font-black text-amber-400 mb-8 tracking-wider">
              MIMIRETO
            </h1>

            <div className="flex justify-between items-center bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
              {/* Marcador Equipo A */}
              <div className="text-center min-w-[150px]">
                <h2 className="text-2xl text-blue-400 font-bold mb-2">
                  EQUIPO A
                </h2>
                <p className="text-6xl font-black">
                  {room.mimireto.teamAScore}
                </p>
              </div>

              {/* Centro: Estado del turno y RELOJ */}
              <div className="flex flex-col items-center justify-center space-y-4 px-8 min-w-[300px]">
                {room.mimireto.status === "TIME_UP" ? (
                  <div className="animate-bounce bg-red-600 px-6 py-2 rounded-full mb-4">
                    <span className="text-2xl font-bold text-white uppercase tracking-wider">
                      ¡TIEMPO!
                    </span>
                  </div>
                ) : room.mimireto.status === "PAUSED" ? (
                  <div className="animate-pulse bg-amber-500 px-6 py-2 rounded-full mb-4 text-slate-950 font-black tracking-wide uppercase">
                    ⚠️ ¡JUEGO PAUSADO! ALGUIEN SE DESCONECTÓ
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
                  className={`text-8xl font-black font-mono tabular-nums transition-colors duration-300 ${
                    room.mimireto.status === "PAUSED"
                      ? "text-amber-500 opacity-60"
                      : (room.mimireto.timeLeft ?? 0) <= 10
                        ? "text-red-500 animate-pulse"
                        : "text-emerald-400"
                  }`}
                >
                  00:{(room.mimireto.timeLeft ?? 0).toString().padStart(2, "0")}
                </div>

                <div className="mt-4">
                  <div className="text-2xl font-bold text-slate-200">
                    Orador:{" "}
                    <span className="text-emerald-400">
                      {
                        room.players.find(
                          (p) => p.id === room.mimireto?.speakerId,
                        )?.name
                      }
                    </span>
                  </div>
                  <div className="text-lg text-rose-400 mt-1">
                    Juez:{" "}
                    <span className="font-semibold">
                      {
                        room.players.find(
                          (p) => p.id === room.mimireto?.judgeId,
                        )?.name
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Marcador Equipo B */}
              <div className="text-center min-w-[150px]">
                <h2 className="text-2xl text-rose-400 font-bold mb-2">
                  EQUIPO B
                </h2>
                <p className="text-6xl font-black">
                  {room.mimireto.teamBScore}
                </p>
              </div>
            </div>
          </div>
        )}

      {/* VISTA 3: PANTALLA DE VICTORIA */}
      {room.mode === "MIMIRETO" && room.mimireto?.status === "FINISHED" && (
        <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <span className="text-7xl animate-bounce inline-block">🏆</span>
          <h1 className="text-6xl font-black text-amber-400 mb-4">
            ¡JUEGO TERMINADO!
          </h1>

          <div className="bg-slate-800 p-12 rounded-3xl border-4 border-slate-700 shadow-2xl min-w-[500px]">
            <p className="text-2xl text-slate-300 mb-6">
              El equipo ganador es...
            </p>
            {room.mimireto.teamAScore > room.mimireto.teamBScore ? (
              <h2 className="text-7xl font-black text-blue-400">EQUIPO A</h2>
            ) : room.mimireto.teamAScore < room.mimireto.teamBScore ? (
              <h2 className="text-7xl font-black text-rose-400">EQUIPO B</h2>
            ) : (
              <h2 className="text-7xl font-black text-amber-100">¡EMPATE!</h2>
            )}

            <div className="flex justify-center gap-12 mt-12 text-4xl font-black">
              <span className="text-blue-400">
                {room.mimireto.teamAScore} pts
              </span>
              <span className="text-slate-500">-</span>
              <span className="text-rose-400">
                {room.mimireto.teamBScore} pts
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
