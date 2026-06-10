import { Repeat, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function TransactionItem({ transaction, category, macroColor, onEdit, onDelete }) {
  const isIncome = transaction.amount > 0;

  return (
    <div className="group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-accent/50 transition-all duration-200">
      {/* Color dot */}
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: macroColor || "hsl(var(--muted-foreground))" }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {category?.name || "Uncategorized"}
          </span>
          {transaction.is_recurrent && (
            <Repeat className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          )}
        </div>
        {transaction.note && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{transaction.note}</p>
        )}
      </div>

      {/* Amount */}
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          isIncome ? "text-emerald-600" : "text-foreground"
        )}
      >
        {isIncome ? "+" : ""}
        {transaction.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(transaction)}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(transaction)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}