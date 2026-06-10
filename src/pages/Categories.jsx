import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CategoryFormDialog from "@/components/budget/CategoryFormDialog";
import DeleteConfirmDialog from "@/components/budget/DeleteConfirmDialog";

export default function Categories() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { user } = useAuth();

  const queryClient = useQueryClient();

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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { data: record, error } = await supabase.from("Category").insert([{ ...data, user_id: user.id }]).select().single();
      if (error) throw error;
      return record;
    },
    onSuccess: () => { invalidate(); setFormOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: record, error } = await supabase.from("Category").update(data).eq("id", id).select().single();
      if (error) throw error;
      return record;
    },
    onSuccess: () => { invalidate(); setFormOpen(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("Category").delete().eq("id", id);
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

  // Group by macro category
  const grouped = {};
  macroCategories.forEach((mc) => {
    grouped[mc.id] = { macro: mc, categories: [] };
  });
  categories.forEach((cat) => {
    if (grouped[cat.macro_category_id]) {
      grouped[cat.macro_category_id].categories.push(cat);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Organize your transactions with labels</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="rounded-full shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="space-y-4">
        {Object.values(grouped).map(({ macro, categories: cats }) => (
          <div key={macro.id} className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: macro.color }} />
              <span className="text-sm font-semibold text-foreground">{macro.name}</span>
              <span className="text-xs text-muted-foreground">{cats.length} categories</span>
            </div>
            {cats.length > 0 ? (
              cats.map((cat) => (
                <div key={cat.id} className="group flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors">
                  <span className="text-sm font-medium">{cat.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(cat); setFormOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleting(cat)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">No categories yet</div>
            )}
          </div>
        ))}

        {macroCategories.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p>Create macro categories first to organize your categories.</p>
          </div>
        )}
      </div>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        category={editing}
        macroCategories={macroCategories}
      />
      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        title="Delete Category?"
        description={`This will remove "${deleting?.name}". Existing transactions will keep their category reference.`}
      />
    </div>
  );
}