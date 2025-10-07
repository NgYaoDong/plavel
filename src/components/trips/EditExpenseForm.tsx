"use client";

import { Expense, Payment } from "@/generated/prisma";
import { useState, useTransition } from "react";
import { Button } from "../ui/button";
import { Pencil, X, DollarSign, User as UserIcon } from "lucide-react";
import { updateExpense } from "@/lib/actions/update-expense";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type ExpenseWithPayment = Expense & {
  payment?: Payment | null;
};

interface Collaborator {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  shareId: string | null;
}

interface EditExpenseFormProps {
  expense: ExpenseWithPayment;
  tripId: string;
  currentUserId: string;
  collaborators: Collaborator[];
}

export default function EditExpenseForm({
  expense,
  tripId,
  currentUserId,
  collaborators,
}: EditExpenseFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [category, setCategory] = useState(expense.category);
  const [paidBy, setPaidBy] = useState(
    expense.payment?.paidBy || currentUserId
  );
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await updateExpense(formData, expense.id, tripId, paidBy);
        setIsOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update expense");
      }
    });
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Expense</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description<span className="text-red-500 px-0.5">*</span>
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Taxi to airport, Souvenirs, Coffee"
              />
            </div>

            {/* Amount */}
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    Amount<span className="text-red-500 px-0.5">*</span>
                  </span>
                </div>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                  className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Category<span className="text-red-500 px-0.5">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Select a category</option>
                <option value="food">Food & Dining</option>
                <option value="transport">Transport</option>
                <option value="activity">Activity</option>
                <option value="shopping">Shopping</option>
                <option value="entertainment">Entertainment</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Paid By */}
            <div>
              <label
                htmlFor="paidBy"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <div className="flex items-center gap-1">
                  <UserIcon className="h-4 w-4" />
                  <span>
                    Paid By<span className="text-red-500 px-0.5">*</span>
                  </span>
                </div>
              </label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {collaborators.map((collab) => (
                    <SelectItem key={collab.id} value={collab.id}>
                      {collab.name || collab.email}
                      {collab.id === currentUserId && " (You)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {expense.payment
                  ? "Updates the payment split equally among all trip members"
                  : "Creates a payment split equally among all trip members"}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
