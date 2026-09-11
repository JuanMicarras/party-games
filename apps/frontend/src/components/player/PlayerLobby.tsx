import { RoomState } from "@party-games/shared";

interface PlayerLobbyProps {
  room: RoomState;
  socketId: string | undefined;
}

export function PlayerLobby({ room, socketId }: PlayerLobbyProps) {
  return (
    <div className="space-y-4">
      <div className="text-center p-6 bg-slate-950 rounded-xl border border-slate-700">
        <p className="text-sm text-slate-400">Estás en la sala</p>
        <p className="text-5xl font-mono font-black text-emerald-400 my-3 tracking-widest">
          {room.roomCode}
        </p>
        <p className="text-slate-300 text-sm animate-pulse">
          Mira la pantalla del TV. Esperando a que empiece la partida...
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
              {player.id === socketId && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30">
                  TÚ
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
