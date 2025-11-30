import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";

interface PinPadProps {
  onNumberPress: (num: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}

export const PinPad = ({ onNumberPress, onDelete, disabled }: PinPadProps) => {
  const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "delete"];

  return (
    <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
      {numbers.map((num, idx) => {
        if (num === "") {
          return <div key={idx} />;
        }
        
        if (num === "delete") {
          return (
            <Button
              key={idx}
              variant="ghost"
              size="lg"
              onClick={onDelete}
              disabled={disabled}
              className="h-16 rounded-2xl hover:bg-accent active:scale-95 transition-transform"
            >
              <Delete className="w-6 h-6 text-muted-foreground" />
            </Button>
          );
        }

        return (
          <Button
            key={idx}
            variant="outline"
            size="lg"
            onClick={() => onNumberPress(num)}
            disabled={disabled}
            className="h-16 text-2xl font-semibold rounded-2xl hover:bg-accent active:scale-95 transition-transform"
          >
            {num}
          </Button>
        );
      })}
    </div>
  );
};