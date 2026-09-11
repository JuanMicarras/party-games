import { useState } from "react";
import { RoomState } from "@party-games/shared";

interface HostLobbyProps {
  room: RoomState;
  onStartGame: (multiplier: number) => void;
}

export function HostLobby({ room, onStartGame }: HostLobbyProps) {
  const [multiplier, setMultiplier] = useState<number>(1);

  return (
    <div className="text-center space-y-8">
      <h1 className="text-3xl font-bold text-slate-400">Únete en tu celular</h1>
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
        <div className="mt-8 flex flex-col items-center gap-5">
          <div className="flex gap-3 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setMultiplier(1)}
              className={`px-6 py-2.5 rounded-xl font-bold transition cursor-pointer ${multiplier === 1 ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
            >
              Rápida (1x)
            </button>
            <button
              onClick={() => setMultiplier(2)}
              className={`px-6 py-2.5 rounded-xl font-bold transition cursor-pointer ${multiplier === 2 ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
            >
              Estándar (2x)
            </button>
          </div>
          <button
            onClick={() => onStartGame(multiplier)}
            className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-2xl transition transform hover:scale-105 shadow-xl cursor-pointer"
          >
            ¡Empezar Juego!
          </button>
        </div>
      )}
    </div>
  );
}
