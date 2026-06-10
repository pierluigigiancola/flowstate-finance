import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MonthSelector from "@/components/budget/MonthSelector";
import TransactionItem from "@/components/budget/TransactionItem";
import TransactionFormDialog from "@/components/budget/TransactionFormDialog";
import DeleteConfirmDialog from "@/components/budget/DeleteConfirmDialog";

export default function Transactions() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState("");
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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["transactions", month, year] });

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

  // Filter by search
  const filtered = transactions.filter((tx) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      tx.Category?.name?.toLowerCase().includes(q) ||
      tx.note?.toLowerCase().includes(q) ||
      String(tx.amount).includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
        <Button onClick={() => { setEditingTx(null); setFormOpen(true); }} className="rounded-full shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions..."
          className="pl-10"
        />
      </div>

      {/* Full list */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {filtered.length > 0 ? (
          filtered.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              category={getCategoryById(tx.category_id)}
              macroColor={getMacroColor(tx)}
              onEdit={(t) => { setEditingTx(t); setFormOpen(true); }}
              onDelete={(t) => setDeletingTx(t)}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {search ? "No matching transactions" : "No transactions this month"}
          </div>
        )}
      </div>

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