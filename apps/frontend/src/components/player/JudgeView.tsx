import { RoomState } from "@party-games/shared";

interface JudgeViewProps {
  room: RoomState;
  onAction: (action: "SUCCESS" | "PASS" | "FOUL") => void;
}

export function JudgeView({ room, onAction }: JudgeViewProps) {
  const card = room.mimireto?.currentCard;
  if (!card) return null;

  return (
    <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-6 text-center shadow-lg mt-4">
      <p className="text-red-400 font-bold mb-1">ERES EL JUEZ</p>
      <p className="text-sm text-slate-300 mb-4">Vigila que no diga:</p>
      <h2 className="text-2xl font-bold text-slate-400 mb-4">{card.word}</h2>

      <div className="flex flex-col gap-2 mb-8 text-left">
        {card.forbidden.map((word, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between px-3 py-2 bg-red-950/60 border border-red-800/50 rounded-lg"
          >
            <span className="text-lg font-bold text-red-400">{word}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => onAction("FOUL")}
        className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-2xl rounded-xl shadow-[0_4px_0_rgb(153,27,27)] active:shadow-none active:translate-y-1 transition-all cursor-pointer"
      >
        ¡FALTA!
      </button>
    </div>
  );
}
