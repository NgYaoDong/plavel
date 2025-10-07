"use client";

import { DollarSign, PieChart, TrendingUp, AlertCircle } from "lucide-react";
import type {
  Trip,
  Location,
  Accommodation,
  Flight,
  Expense,
} from "@/generated/prisma";
import AddExpenseForm from "./AddExpenseForm";
import ExpensesList from "./ExpensesList";

interface BudgetOverviewProps {
  trip: Trip & {
    locations: Location[];
    accommodations: Accommodation[];
    flights: Flight[];
    expenses: Expense[];
  };
  canEdit: boolean;
}

const CATEGORY_COLORS = {
  food: "bg-orange-100 text-orange-700 border-orange-200",
  transport: "bg-blue-100 text-blue-700 border-blue-200",
  activity: "bg-green-100 text-green-700 border-green-200",
  shopping: "bg-purple-100 text-purple-700 border-purple-200",
  entertainment: "bg-pink-100 text-pink-700 border-pink-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

export function BudgetOverview({ trip, canEdit }: BudgetOverviewProps) {
  // Calculate total spending
  const locationCosts =
    trip.locations?.reduce((sum, loc) => sum + (loc.cost || 0), 0) || 0;
  const accommodationCosts =
    trip.accommodations?.reduce((sum, acc) => sum + (acc.cost || 0), 0) || 0;
  const flightCosts =
    trip.flights?.reduce((sum, flight) => sum + (flight.cost || 0), 0) || 0;
  const expenseCosts =
    trip.expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) ||
    0;

  const totalSpent =
    locationCosts + accommodationCosts + flightCosts + expenseCosts;
  const budget = trip.budget || 0;
  const remaining = budget - totalSpent;
  const percentageSpent = budget > 0 ? (totalSpent / budget) * 100 : 0;

  // Get spending by category
  const categoryBreakdown: Record<string, number> = {
    food: 0,
    transport: 0,
    activity: 0,
    shopping: 0,
    entertainment: 0,
    other: 0,
    accommodations: accommodationCosts,
    flights: flightCosts,
  };

  trip.locations?.forEach((loc) => {
    if (loc.cost) {
      const category = loc.category?.toLowerCase() || "other";
      if (category in categoryBreakdown) {
        categoryBreakdown[category] += loc.cost;
      } else {
        categoryBreakdown.other += loc.cost;
      }
    }
  });

  // Add expenses to category breakdown
  trip.expenses?.forEach((expense) => {
    const category = expense.category?.toLowerCase() || "other";
    if (category in categoryBreakdown) {
      categoryBreakdown[category] += expense.amount;
    } else {
      categoryBreakdown.other += expense.amount;
    }
  });

  // Budget status color
  let budgetStatusColor = "bg-green-500";
  let budgetStatusText = "Within Budget";
  if (percentageSpent >= 100) {
    budgetStatusColor = "bg-red-500";
    budgetStatusText = "Over Budget";
  } else if (percentageSpent >= 80) {
    budgetStatusColor = "bg-yellow-500";
    budgetStatusText = "Approaching Limit";
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Add Expense Button */}
      <div className="flex justify-between items-center md:flex-row gap=4">
        <h2 className="text-2xl font-semibold">Budget</h2>
        {canEdit && <AddExpenseForm tripId={trip.id} />}
      </div>

      {/* Budget Summary Card */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Budget Summary
          </h3>
        </div>

        {budget > 0 ? (
          <>
            {/* Budget Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(budget)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Remaining</p>
                <p
                  className={`text-2xl font-bold ${
                    remaining < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatCurrency(remaining)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {budgetStatusText}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {percentageSpent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${budgetStatusColor}`}
                  style={{
                    width: `${Math.min(percentageSpent, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Warning if over budget */}
            {percentageSpent >= 100 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  You have exceeded your budget by{" "}
                  <span className="font-semibold">
                    {formatCurrency(Math.abs(remaining))}
                  </span>
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">No budget set for this trip</p>
            <p className="text-sm text-gray-400">
              Add a budget to track your spending
            </p>
          </div>
        )}
      </div>

      {/* Spending Breakdown */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Spending Breakdown
          </h3>
        </div>

        {totalSpent > 0 ? (
          <div className="space-y-3">
            {/* Locations by Category */}
            {Object.entries(categoryBreakdown).map(([category, amount]) => {
              if (amount === 0) return null;

              const percentage = budget > 0 ? (amount / budget) * 100 : 0;
              const colorClass =
                category === "accommodations"
                  ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                  : category === "flights"
                    ? "bg-cyan-100 text-cyan-700 border-cyan-200"
                    : CATEGORY_COLORS[
                        category as keyof typeof CATEGORY_COLORS
                      ] || CATEGORY_COLORS.other;

              return (
                <div key={category} className="flex items-center gap-3">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium border capitalize w-[120px] text-center ${colorClass}`}
                  >
                    {category}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">
                        {formatCurrency(amount)}
                      </span>
                      {budget > 0 && (
                        <span className="text-xs text-gray-500">
                          {percentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    {budget > 0 && (
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gray-400 transition-all duration-300"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Total */}
            <div className="pt-3 mt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  Total Expenses
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(totalSpent)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 mb-1">No expenses recorded yet</p>
            <p className="text-sm text-gray-400">
              Add costs to your locations, accommodations, and flights to see
              spending breakdown
            </p>
          </div>
        )}
      </div>

      {/* Manual Expenses List */}
      <ExpensesList
        expenses={trip.expenses || []}
        tripId={trip.id}
        canEdit={canEdit}
      />
    </div>
  );
}
