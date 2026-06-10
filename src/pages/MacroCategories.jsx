import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MacroCategoryFormDialog from "@/components/budget/MacroCategoryFormDialog";
import DeleteConfirmDialog from "@/components/budget/DeleteConfirmDialog";

export default function MacroCategories() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { user } = useAuth();

  const queryClient = useQueryClient();

  const { data: macroCategories = [] } = useQuery({
    queryKey: ["macroCategories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("MacroCategory").select("*");
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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["macroCategories"] });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { data: record, error } = await supabase.from("MacroCategory").insert([{ ...data, user_id: user.id }]).select().single();
      if (error) throw error;
      return record;
    },
    onSuccess: () => { invalidate(); setFormOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: record, error } = await supabase.from("MacroCategory").update(data).eq("id", id).select().single();
      if (error) throw error;
      return record;
    },
    onSuccess: () => { invalidate(); setFormOpen(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("MacroCategory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setDeleting(null); },
  });

  const handleSubmit = (data) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getCategoryCount = (macroId) => categories.filter((c) => c.macro_category_id === macroId).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Macro Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Color-coded groups for your categories</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="rounded-full shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Macro Category
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {macroCategories.map((mc) => (
          <div
            key={mc.id}
            className="group bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all duration-200 relative overflow-hidden"
          >
            {/* Color accent */}
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: mc.color }} />

            <div className="flex items-start justify-between ml-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: mc.color + "20" }}>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: mc.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{mc.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getCategoryCount(mc.id)} categories
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(mc); setFormOpen(true); }}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleting(mc)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {macroCategories.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>No macro categories yet. Create one to get started.</p>
          <Button variant="link" onClick={() => setFormOpen(true)} className="mt-2">
            Create your first macro category
          </Button>
        </div>
      )}

      <MacroCategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        macroCategory={editing}
      />
      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        title="Delete Macro Category?"
        description={`This will remove "${deleting?.name}" and unlink its categories.`}
      />
    </div>
  );
}