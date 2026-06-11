import { supabase } from "@/api/supabaseClient";
import { addMonths, addYears, format, isBefore, isSameDay, parseISO, startOfMonth } from "date-fns";

/**
 * Generates missing transactions for all active recurring transactions of a user.
 * @param {string} userId - The Supabase user ID.
 */
export async function generateRecurringTransactions(userId) {
    if (!userId) return;

    // 1. Fetch active recurring transactions
    const { data: recurring, error: recError } = await supabase
        .from("RecurringTransaction")
        .select("*")
        .eq("user_id", userId)
        .eq("active", true);

    if (recError) {
        console.error("Error fetching recurring transactions:", recError);
        return;
    }

    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");

    for (const rule of recurring) {
        let currentDate = parseISO(rule.start_date);

        // 2. Fetch already generated transactions for this rule
        const { data: existing, error: existError } = await supabase
            .from("Transaction")
            .select("date")
            .eq("recurring_transaction_id", rule.id);

        if (existError) {
            console.error(`Error fetching existing for rule ${rule.id}:`, existError);
            continue;
        }

        const existingDates = new Set(existing.map(t => t.date));
        const newTransactions = [];

        // 3. Calculate all dates from start_date until today
        while (isBefore(currentDate, today) || isSameDay(currentDate, today)) {
            const dateStr = format(currentDate, "yyyy-MM-dd");

            if (!existingDates.has(dateStr)) {
                newTransactions.push({
                    user_id: userId,
                    amount: rule.amount,
                    category_id: rule.category_id,
                    date: dateStr,
                    note: rule.note,
                    is_recurrent: true,
                    recurring_transaction_id: rule.id
                });
            }

            // Increment based on frequency
            if (rule.frequency === "monthly") {
                currentDate = addMonths(currentDate, 1);
            } else if (rule.frequency === "yearly") {
                currentDate = addYears(currentDate, 1);
            } else {
                break; // Safety
            }
        }

        // 4. Batch insert new transactions
        if (newTransactions.length > 0) {
            const { error: insertError } = await supabase
                .from("Transaction")
                .insert(newTransactions);

            if (insertError) {
                console.error(`Error inserting generated transactions for rule ${rule.id}:`, insertError);
            } else {
                console.log(`Generated ${newTransactions.length} transactions for rule: ${rule.note || rule.id}`);
            }
        }
    }
}
