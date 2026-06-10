import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MonthSummary({ transactions }) {
  const income = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const balance = income - expenses;

  const fmt = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const cards = [
    { label: "Income", value: fmt(income), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Expenses", value: fmt(expenses), icon: TrendingDown, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Balance", value: fmt(balance), icon: Wallet, color: balance >= 0 ? "text-primary" : "text-destructive", bg: "bg-primary/5" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="bg-card rounded-2xl border border-border p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", c.bg)}>
                <Icon className={cn("w-4 h-4", c.color)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{c.label}</p>
            <p className={cn("text-lg sm:text-xl font-bold tabular-nums mt-1", c.color)}>{c.value}</p>
          </div>
        );
      })}
    </div>
  );
}