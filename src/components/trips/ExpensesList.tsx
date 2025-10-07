"use client";

import { Expense } from "@/generated/prisma";
import { Receipt, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "../ui/button";
import { deleteExpense } from "@/lib/actions/delete-expense";
import EditExpenseForm from "./EditExpenseForm";

const CATEGORY_COLORS = {
  food: "bg-orange-100 text-orange-700 border-orange-200",
  transport: "bg-blue-100 text-blue-700 border-blue-200",
  activity: "bg-green-100 text-green-700 border-green-200",
  shopping: "bg-purple-100 text-purple-700 border-purple-200",
  entertainment: "bg-pink-100 text-pink-700 border-pink-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

interface ExpensesListProps {
  expenses: Expense[];
  tripId: string;
}

export default function ExpensesList({ expenses, tripId }: ExpensesListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-SG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (expenses.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 bg-white text-center">
        <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 mb-1">No manual expenses added yet</p>
        <p className="text-sm text-gray-400">
          Click &ldquo;Add Expense&rdquo; to track miscellaneous costs
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Manual Expenses</h3>
        <span className="text-sm text-gray-500">({expenses.length})</span>
      </div>

      <div className="space-y-3">
        {expenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            tripId={tripId}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        ))}
      </div>
    </div>
  );
}

interface ExpenseCardProps {
  expense: Expense;
  tripId: string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
}

function ExpenseCard({
  expense,
  tripId,
  formatCurrency,
  formatDate,
}: ExpenseCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      await deleteExpense(expense.id, tripId);
    });
  };

  const colorClass =
    CATEGORY_COLORS[expense.category as keyof typeof CATEGORY_COLORS] ||
    CATEGORY_COLORS.other;

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <h4 className="font-medium text-gray-900">{expense.description}</h4>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border capitalize min-w-[110px] text-center ${colorClass}`}
          >
            {expense.category}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{formatDate(expense.createdAt)}</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(expense.amount)}
          </span>
        </div>
      </div>

      {!showDeleteConfirm ? (
        <div className="flex gap-1">
          <EditExpenseForm expense={expense} tripId={tripId} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isPending}
            className="text-gray-600"
          >
            Cancel
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      )}
    </div>
  );
}
