import { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function RecurringTransactionFormDialog({
    open, onOpenChange, onSubmit, recurringTransaction, categories, macroCategories
}) {
    const [form, setForm] = useState({
        amount: "",
        category_id: "",
        frequency: "monthly",
        start_date: format(new Date(), "yyyy-MM-dd"),
        note: "",
    });

    useEffect(() => {
        if (recurringTransaction) {
            setForm({
                amount: String(recurringTransaction.amount),
                category_id: recurringTransaction.category_id || "",
                frequency: recurringTransaction.frequency || "monthly",
                start_date: recurringTransaction.start_date || format(new Date(), "yyyy-MM-dd"),
                note: recurringTransaction.note || "",
            });
        } else {
            setForm({
                amount: "",
                category_id: "",
                frequency: "monthly",
                start_date: format(new Date(), "yyyy-MM-dd"),
                note: "",
            });
        }
    }, [recurringTransaction, open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            amount: parseFloat(form.amount),
            category_id: form.category_id,
            frequency: form.frequency,
            start_date: form.start_date,
            note: form.note || undefined,
        });
    };

    const selectedDate = form.start_date ? parseISO(form.start_date) : undefined;

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
                        {recurringTransaction ? "Edit Subscription" : "New Subscription"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g. -6.99 (Netflix)"
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            required
                            className="text-lg font-semibold tabular-nums"
                        />
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
                            <Label>Frequency</Label>
                            <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start font-normal text-left">
                                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {selectedDate ? format(selectedDate, "dd MMM yyyy") : <span>Pick date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(d) => d && setForm({ ...form, start_date: format(d, "yyyy-MM-dd") })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Note (Optional)</Label>
                        <Textarea
                            placeholder="e.g. Standard Plan"
                            value={form.note}
                            onChange={(e) => setForm({ ...form, note: e.target.value })}
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="submit" className="w-full sm:w-auto">
                            {recurringTransaction ? "Save Changes" : "Create Subscription"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
