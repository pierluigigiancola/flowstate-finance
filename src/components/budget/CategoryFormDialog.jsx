import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

export default function CategoryFormDialog({ open, onOpenChange, onSubmit, category, macroCategories }) {
  const [name, setName] = useState("");
  const [macroId, setMacroId] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.name);
      setMacroId(category.macro_category_id);
    } else {
      setName("");
      setMacroId("");
    }
  }, [category, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, macro_category_id: macroId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">
            {category ? "Edit Category" : "New Category"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rent, Groceries, Salary..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Macro Category</Label>
            <Select value={macroId} onValueChange={setMacroId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select macro category" />
              </SelectTrigger>
              <SelectContent>
                {macroCategories.map((mc) => (
                  <SelectItem key={mc.id} value={mc.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mc.color }} />
                      {mc.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{category ? "Save" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}