import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function TransactionFormDialog({
  open, onOpenChange, onSubmit, transaction, categories, macroCategories, currentMonth, currentYear
}) {
  const defaultDate = new Date(currentYear, currentMonth - 1, new Date().getDate());

  const [form, setForm] = useState({
    amount: "",
    category_id: "",
    date: format(defaultDate, "yyyy-MM-dd"),
    is_recurrent: false,
    note: "",
  });

  useEffect(() => {
    if (transaction) {
      setForm({
        amount: String(transaction.amount),
        category_id: transaction.category_id || "",
        date: transaction.date || format(defaultDate, "yyyy-MM-dd"),
        is_recurrent: transaction.is_recurrent || false,
        note: transaction.note || "",
      });
    } else {
      setForm({
        amount: "",
        category_id: "",
        date: format(new Date(currentYear, currentMonth - 1, new Date().getDate()), "yyyy-MM-dd"),
        is_recurrent: false,
        note: "",
      });
    }
  }, [transaction, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const d = form.date ? parseISO(form.date) : null;
    onSubmit({
      amount: parseFloat(form.amount),
      category_id: form.category_id,
      date: form.date || undefined,
      // keep month/year derived from the chosen date for filtering
      month: d ? d.getMonth() + 1 : currentMonth,
      year: d ? d.getFullYear() : currentYear,
      day: d ? d.getDate() : undefined,
      is_recurrent: form.is_recurrent,
      note: form.note || undefined,
    });
  };

  const selectedDate = form.date ? parseISO(form.date) : undefined;

  // Group categories by macro
  const grouped = {};
  categories.forEach((cat) => {
    const macro = macroCategories.find((m) => m.id === cat.macro_category_id);
    const key = macro?.id || "other";
    if (!grouped[key]) grouped[key] = { macroName: macro?.name || "Other", color: macro?.color, cats: [] };
    grouped[key].cats.push(cat);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {transaction ? "Edit Transaction" : "New Transaction"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="e.g. -50.00 or 1000"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              className="text-lg font-semibold tabular-nums"
            />
            <p className="text-xs text-muted-foreground">Use negative for expenses, positive for income</p>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(grouped).map(([macroId, { macroName, color, cats }]) => (
                  <div key={macroId}>
                    <div className="px-2 py-1.5 flex items-center gap-2">
                      {color && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />}
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{macroName}</span>
                    </div>
                    {cats.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal text-left">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {selectedDate ? format(selectedDate, "dd MMM yyyy") : <span className="text-muted-foreground">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setForm({ ...form, date: format(d, "yyyy-MM-dd") })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Recurrent</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch
                  checked={form.is_recurrent}
                  onCheckedChange={(v) => setForm({ ...form, is_recurrent: v })}
                />
                <span className="text-sm text-muted-foreground">
                  {form.is_recurrent ? "Monthly" : "One-time"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea
              placeholder="Optional note..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{transaction ? "Save" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}