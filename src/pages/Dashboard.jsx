import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import MonthSelector from "@/components/budget/MonthSelector";
import MonthSummary from "@/components/budget/MonthSummary";
import TransactionItem from "@/components/budget/TransactionItem";
import TransactionFormDialog from "@/components/budget/TransactionFormDialog";
import DeleteConfirmDialog from "@/components/budget/DeleteConfirmDialog";

export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [formOpen, setFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [deletingTx, setDeletingTx] = useState(null);
  const { user } = useAuth();

  const queryClient = useQueryClient();

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", month, year],
    queryFn: async () => {
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("Transaction")
        .select(`
          *,
          Category (
            *,
            MacroCategory (*)
          )
        `)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("Category").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: macroCategories = [] } = useQuery({
    queryKey: ["macroCategories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("MacroCategory").select("*");
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["transactions", month, year] });
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { data: record, error } = await supabase.from("Transaction").insert([{ ...data, user_id: user.id }]).select().single();
      if (error) throw error;
      return record;
    },
    onSuccess: () => { invalidate(); setFormOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: record, error } = await supabase.from("Transaction").update(data).eq("id", id).select().single();
      if (error) throw error;
      return record;
    },
    onSuccess: () => { invalidate(); setFormOpen(false); setEditingTx(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("Transaction").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setDeletingTx(null); },
  });

  const handleSubmit = (data) => {
    if (editingTx) {
      updateMutation.mutate({ id: editingTx.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getCategoryById = (id) => categories.find((c) => c.id === id);
  const getMacroColor = (tx) => tx.Category?.MacroCategory?.color;

  // Group transactions by day (derived from date field)
  const grouped = {};
  const noDayTxs = [];
  transactions.forEach((tx) => {
    const day = tx.date ? new Date(tx.date).getDate() : tx.day;
    if (day) {
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(tx);
    } else {
      noDayTxs.push(tx);
    }
  });

  const sortedDays = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
        <Button onClick={() => { setEditingTx(null); setFormOpen(true); }} className="rounded-full shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Summary cards */}
      <MonthSummary transactions={transactions} />

      {/* Transaction list by day */}
      <div className="space-y-4">
        {noDayTxs.length > 0 && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">No date assigned</span>
            </div>
            {noDayTxs.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                category={getCategoryById(tx.category_id)}
                macroColor={getMacroColor(tx)}
                onEdit={(t) => { setEditingTx(t); setFormOpen(true); }}
                onDelete={(t) => setDeletingTx(t)}
              />
            ))}
          </div>
        )}

        {sortedDays.map((day) => (
          <div key={day} className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Day {day}
              </span>
              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                {grouped[day].reduce((s, t) => s + t.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {grouped[day].map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                category={getCategoryById(tx.category_id)}
                macroColor={getMacroColor(tx)}
                onEdit={(t) => { setEditingTx(t); setFormOpen(true); }}
                onDelete={(t) => setDeletingTx(t)}
              />
            ))}
          </div>
        ))}

        {transactions.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No transactions this month</p>
            <Button variant="link" onClick={() => setFormOpen(true)} className="mt-2">
              Add your first transaction
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        transaction={editingTx}
        categories={categories}
        macroCategories={macroCategories}
        currentMonth={month}
        currentYear={year}
      />
      <DeleteConfirmDialog
        open={!!deletingTx}
        onOpenChange={(open) => !open && setDeletingTx(null)}
        onConfirm={() => deleteMutation.mutate(deletingTx.id)}
        title="Delete Transaction?"
        description="This will permanently remove this transaction."
      />
    </div>
  );
}