import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Calendar, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecurringTransactionFormDialog from "@/components/budget/RecurringTransactionFormDialog";
import DeleteConfirmDialog from "@/components/budget/DeleteConfirmDialog";
import { cn } from "@/lib/utils";

export default function RecurringTransactions() {
    const [formOpen, setFormOpen] = useState(false);
    const [editingRec, setEditingRec] = useState(null);
    const [deletingRec, setDeletingRec] = useState(null);
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: recurring = [] } = useQuery({
        queryKey: ["recurringTransactions"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("RecurringTransaction")
                .select(`
          *,
          Category (
            *,
            MacroCategory (*)
          )
        `)
                .order("created_at", { ascending: false });
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

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["recurringTransactions"] });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const { data: record, error } = await supabase.from("RecurringTransaction").insert([{ ...data, user_id: user.id }]).select().single();
            if (error) throw error;
            return record;
        },
        onSuccess: () => { invalidate(); setFormOpen(false); },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const { data: record, error } = await supabase.from("RecurringTransaction").update(data).eq("id", id).select().single();
            if (error) throw error;
            return record;
        },
        onSuccess: () => { invalidate(); setFormOpen(false); setEditingRec(null); },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from("RecurringTransaction").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => { invalidate(); setDeletingRec(null); },
    });

    const handleSubmit = (data) => {
        if (editingRec) {
            updateMutation.mutate({ id: editingRec.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-display">Subscriptions</h1>
                    <p className="text-sm text-muted-foreground">Manage your recurring payments and generators.</p>
                </div>
                <Button onClick={() => { setEditingRec(null); setFormOpen(true); }} className="rounded-full shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subscription
                </Button>
            </div>

            <div className="grid gap-4">
                {recurring.length > 0 ? (
                    recurring.map((rec) => (
                        <div key={rec.id} className="bg-card p-4 rounded-2xl border border-border flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center bg-accent"
                                    style={{ backgroundColor: rec.Category?.MacroCategory?.color + '20', color: rec.Category?.MacroCategory?.color }}
                                >
                                    <Repeat className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">{rec.Category?.name || "Uncategorized"}</h3>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="capitalize">{rec.frequency}</span>
                                        <span>•</span>
                                        <span>Starts {new Date(rec.start_date).toLocaleDateString()}</span>
                                        {rec.note && (
                                            <>
                                                <span>•</span>
                                                <span className="italic">{rec.note}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className={cn(
                                    "font-bold tabular-nums",
                                    rec.amount > 0 ? "text-emerald-600" : "text-foreground"
                                )}>
                                    {rec.amount > 0 ? "+" : ""}{rec.amount.toFixed(2)}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => { setEditingRec(rec); setFormOpen(true); }}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingRec(rec)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                        <p className="text-muted-foreground">No subscriptions yet.</p>
                    </div>
                )}
            </div>

            <RecurringTransactionFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleSubmit}
                recurringTransaction={editingRec}
                categories={categories}
                macroCategories={macroCategories}
            />

            <DeleteConfirmDialog
                open={!!deletingRec}
                onOpenChange={(v) => !v && setDeletingRec(null)}
                onConfirm={() => deleteMutation.mutate(deletingRec.id)}
                title="Delete Subscription?"
                description="This will stop generating future transactions. All past transactions generated by this subscription will remain in your history."
            />
        </div>
    );
}
