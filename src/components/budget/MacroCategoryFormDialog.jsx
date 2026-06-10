import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PRESET_COLORS = [
  "#4F46E5", "#7C3AED", "#DB2777", "#DC2626",
  "#EA580C", "#D97706", "#16A34A", "#0D9488",
  "#0284C7", "#6366F1", "#8B5CF6", "#64748B",
];

export default function MacroCategoryFormDialog({ open, onOpenChange, onSubmit, macroCategory }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    if (macroCategory) {
      setName(macroCategory.name);
      setColor(macroCategory.color);
    } else {
      setName("");
      setColor(PRESET_COLORS[0]);
    }
  }, [macroCategory, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, color });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">
            {macroCategory ? "Edit Macro Category" : "New Macro Category"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Housing, Food, Income..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-all duration-200 ring-offset-2 ring-offset-background"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
                    transform: color === c ? "scale(1.15)" : "scale(1)",
                  }}
                />
              ))}
            </div>
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-16 h-8 p-0 border-none cursor-pointer"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{macroCategory ? "Save" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}