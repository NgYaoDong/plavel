"use client";

import { useState, useTransition } from "react";
import { Button } from "../ui/button";
import { DollarSign, Users, Pencil, X } from "lucide-react";
import { updatePayment } from "@/lib/actions/update-payment";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import type { Payment, PaymentSplit, User } from "@/generated/prisma";

interface Collaborator {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  shareId: string | null;
}

type PaymentWithSplits = Payment & {
  splits: (PaymentSplit & {
    user: User;
  })[];
};

interface EditPaymentFormProps {
  payment: PaymentWithSplits;
  collaborators: Collaborator[];
  onSuccess?: () => void;
}

export default function EditPaymentForm({
  payment,
  collaborators,
  onSuccess,
}: EditPaymentFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [description, setDescription] = useState(payment.description);
  const [amount, setAmount] = useState(payment.amount.toString());
  const [category, setCategory] = useState(payment.category || "");
  const [splitType, setSplitType] = useState<"equal" | "custom" | "percentage">(
    payment.splitType as "equal" | "custom" | "percentage"
  );
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(
    new Set(payment.splits.map((s) => s.userId))
  );
  const [customAmounts, setCustomAmounts] = useState<Map<string, string>>(
    new Map(payment.splits.map((s) => [s.userId, s.amount.toString()]))
  );
  const [percentages, setPercentages] = useState<Map<string, string>>(
    new Map()
  );
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (selectedUsers.size === 0) {
      setError("Please select at least one person to split with");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    // Build splits array
    const splits = Array.from(selectedUsers)
      .map((userId) => {
        const split: { userId: string; amount?: number; percentage?: number } =
          {
            userId,
          };

        if (splitType === "custom") {
          const customAmount = parseFloat(customAmounts.get(userId) || "0");
          if (isNaN(customAmount) || customAmount < 0) {
            setError(
              `Invalid amount for ${collaborators.find((c) => c.id === userId)?.name}`
            );
            return null;
          }
          split.amount = customAmount;
        } else if (splitType === "percentage") {
          const percentage = parseFloat(percentages.get(userId) || "0");
          if (isNaN(percentage) || percentage < 0 || percentage > 100) {
            setError(
              `Invalid percentage for ${collaborators.find((c) => c.id === userId)?.name}`
            );
            return null;
          }
          split.percentage = percentage;
        }

        return split;
      })
      .filter((s) => s !== null) as {
      userId: string;
      amount?: number;
      percentage?: number;
    }[];

    if (splits.length !== selectedUsers.size) {
      return; // Error was set above
    }

    // Validate custom splits sum
    if (splitType === "custom") {
      const total = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
      if (Math.abs(total - amountNum) > 0.01) {
        setError(`Custom amounts must sum to ${amountNum.toFixed(2)}`);
        return;
      }
    }

    // Validate percentages sum
    if (splitType === "percentage") {
      const total = splits.reduce((sum, s) => sum + (s.percentage || 0), 0);
      if (Math.abs(total - 100) > 0.01) {
        setError(
          `Percentages must sum to 100% (currently ${total.toFixed(1)}%)`
        );
        return;
      }
    }

    startTransition(async () => {
      try {
        await updatePayment({
          paymentId: payment.id,
          description,
          amount: amountNum,
          category: category || undefined,
          splitType,
          splits,
        });
        setIsOpen(false);
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update payment");
      }
    });
  };

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
      customAmounts.delete(userId);
      percentages.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const updateCustomAmount = (userId: string, value: string) => {
    const newAmounts = new Map(customAmounts);
    newAmounts.set(userId, value);
    setCustomAmounts(newAmounts);
  };

  const updatePercentage = (userId: string, value: string) => {
    const newPercentages = new Map(percentages);
    newPercentages.set(userId, value);
    setPercentages(newPercentages);
  };

  const autoFillEqual = () => {
    if (selectedUsers.size === 0) return;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    if (splitType === "custom") {
      const equalAmount = (amountNum / selectedUsers.size).toFixed(2);
      const newAmounts = new Map<string, string>();
      selectedUsers.forEach((userId) => {
        newAmounts.set(userId, equalAmount);
      });
      setCustomAmounts(newAmounts);
    } else if (splitType === "percentage") {
      const equalPercentage = (100 / selectedUsers.size).toFixed(2);
      const newPercentages = new Map<string, string>();
      selectedUsers.forEach((userId) => {
        newPercentages.set(userId, equalPercentage);
      });
      setPercentages(newPercentages);
    }
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
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Payment</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description<span className="text-red-500 px-0.5">*</span>
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="e.g., Dinner at restaurant, Hotel booking"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    Amount<span className="text-red-500 px-0.5">*</span>
                  </span>
                </div>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food & Dining</SelectItem>
                  <SelectItem value="accommodation">Accommodation</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="activity">Activities</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Split Type */}
            <div className="space-y-2">
              <Label htmlFor="splitType">
                Split Type<span className="text-red-500 px-0.5">*</span>
              </Label>
              <Select
                value={splitType}
                onValueChange={(v: "equal" | "custom" | "percentage") =>
                  setSplitType(v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">Equal Split</SelectItem>
                  <SelectItem value="custom">Custom Amounts</SelectItem>
                  <SelectItem value="percentage">By Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* People Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      Split With<span className="text-red-500 px-0.5">*</span>
                    </span>
                  </div>
                </Label>
                {(splitType === "custom" || splitType === "percentage") &&
                  selectedUsers.size > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={autoFillEqual}
                    >
                      Auto-fill equally
                    </Button>
                  )}
              </div>

              <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                {collaborators.map((collab) => (
                  <div key={collab.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`user-${collab.id}`}
                        checked={selectedUsers.has(collab.id)}
                        onCheckedChange={() => toggleUser(collab.id)}
                      />
                      <Label
                        htmlFor={`user-${collab.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        {collab.name || collab.email}
                      </Label>

                      {selectedUsers.has(collab.id) && splitType === "custom" && (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={customAmounts.get(collab.id) || ""}
                          onChange={(e) =>
                            updateCustomAmount(collab.id, e.target.value)
                          }
                          className="w-32"
                        />
                      )}

                      {selectedUsers.has(collab.id) &&
                        splitType === "percentage" && (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={percentages.get(collab.id) || ""}
                              onChange={(e) =>
                                updatePercentage(collab.id, e.target.value)
                              }
                              className="w-24"
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        )}

                      {selectedUsers.has(collab.id) && splitType === "equal" && (
                        <span className="text-sm text-gray-500">
                          $
                          {amount && selectedUsers.size > 0
                            ? (parseFloat(amount) / selectedUsers.size).toFixed(
                                2
                              )
                            : "0.00"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
