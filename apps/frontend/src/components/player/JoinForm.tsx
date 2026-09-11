import { useState } from "react";
import Link from "next/link";
import { JoinRoomPayload } from "@party-games/shared";

interface JoinFormProps {
  isConnected: boolean;
  onJoin: (payload: JoinRoomPayload) => void;
}

export function JoinForm({ isConnected, onJoin }: JoinFormProps) {
  const [roomCode, setRoomCode] = useState("ABCD");
  const [playerName, setPlayerName] = useState("");

  const handleSubmit = () => {
    if (!playerName.trim()) return;
    onJoin({ roomCode: roomCode.toUpperCase(), playerName: playerName.trim() });
  };

  return (
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
        onClick={handleSubmit}
        disabled={!isConnected}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-bold text-lg transition cursor-pointer shadow-lg active:translate-y-0.5"
      >
        Unirse a la Sala
      </button>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-700"></div>
        <span className="flex-shrink mx-3 text-xs uppercase font-semibold text-slate-400">
          ¿Vas a proyectar en TV?
        </span>
        <div className="flex-grow border-t border-slate-700"></div>
      </div>

      <Link
        href="/host"
        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-950 hover:bg-slate-900 text-emerald-400 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-xl font-bold text-base transition shadow-md group"
      >
        <span>📺</span>
        <span>Crear Sala (Pantalla Host / TV)</span>
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </Link>
    </div>
  );
}

