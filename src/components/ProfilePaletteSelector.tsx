
import { Palette } from "lucide-react";

type PaletteValue = "default" | "green" | "red";
type Option = { value: PaletteValue; label: string; color: string };

const paletteOptions: Option[] = [
  { value: "default", label: "Default", color: "#009fef" },
  { value: "green", label: "Verde", color: "#23c69e" },
  { value: "red", label: "Rosso", color: "#ff325b" },
];

type Props = {
  palette: PaletteValue;
  onSelect: (palette: PaletteValue) => void;
};

export default function ProfilePaletteSelector({ palette, onSelect }: Props) {
  return (
    <div className="w-full">
      <label className="block mb-2 font-medium">
        Palette colore <Palette className="inline ml-1" size={16} />
      </label>
      <div className="flex gap-4">
        {paletteOptions.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`rounded-xl border p-2 flex-1 flex flex-col items-center ${
              palette === opt.value
                ? "ring-2 ring-primary border-primary"
                : "hover:border-primary"
            }`}
            style={{ backgroundColor: "#fff", borderColor: opt.color }}
          >
            <span
              className="block w-7 h-7 rounded-full mb-1"
              style={{
                background: opt.color,
                border: palette === opt.value ? "2px solid #333" : "1px solid #aaa",
                boxShadow: palette === opt.value ? "0 0 0 2px #009fef4d" : undefined,
              }}
            />
            <span className="text-xs">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
