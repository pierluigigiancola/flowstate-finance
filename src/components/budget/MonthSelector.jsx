import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function MonthSelector({ month, year, onChange }) {
  const date = new Date(year, month - 1);

  const goPrev = () => {
    const prev = new Date(year, month - 2);
    onChange(prev.getMonth() + 1, prev.getFullYear());
  };

  const goNext = () => {
    const next = new Date(year, month);
    onChange(next.getMonth() + 1, next.getFullYear());
  };

  const goToday = () => {
    const now = new Date();
    onChange(now.getMonth() + 1, now.getFullYear());
  };

  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" onClick={goPrev} className="rounded-full">
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <button
        onClick={goToday}
        className="font-display text-2xl font-bold tracking-tight text-foreground hover:text-primary transition-colors min-w-[200px] text-center"
      >
        {format(date, "MMMM yyyy")}
      </button>
      <Button variant="ghost" size="icon" onClick={goNext} className="rounded-full">
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}