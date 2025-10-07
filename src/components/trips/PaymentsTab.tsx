"use client";

import { DollarSign, Users, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import type {
  Trip,
  Location,
  Accommodation,
  Flight,
  Expense,
  Payment,
  PaymentSplit,
  User,
} from "@/generated/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import AddPaymentForm from "./AddPaymentForm";
import EditPaymentForm from "./EditPaymentForm";
import { deletePayment } from "@/lib/actions/delete-payment";
import {
  settlePaymentSplit,
  settleAllDebts,
} from "@/lib/actions/settle-payment";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PaymentWithRelations = Payment & {
  payer: User;
  splits: (PaymentSplit & {
    user: User;
  })[];
};

interface Collaborator {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  shareId: string | null;
}

interface PaymentsTabProps {
  trip: Trip & {
    locations: Location[];
    accommodations: Accommodation[];
    flights: Flight[];
    expenses: Expense[];
  };
  payments: PaymentWithRelations[];
  currentUserId: string;
  collaborators: Collaborator[];
  canEdit: boolean;
}

interface DebtSummary {
  from: User;
  to: User;
  amount: number;
}

export default function PaymentsTab({
  trip,
  payments,
  currentUserId,
  collaborators,
  canEdit,
}: PaymentsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settleAllDialogOpen, setSettleAllDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<{ fromId: string; toId: string } | null>(null);
  const router = useRouter();

  // Calculate debt summary (who owes whom)
  const debtSummary = useMemo(() => {
    // Create a map of net balances: positive means owed money, negative means owes money
    const balances = new Map<string, { user: User; balance: number }>();

    // Initialize balances for all collaborators
    collaborators.forEach((collab) => {
      balances.set(collab.id, {
        user: {
          id: collab.id,
          name: collab.name,
          email: collab.email,
          image: collab.image,
          emailVerified: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        balance: 0,
      });
    });

    // Process each payment
    payments.forEach((payment) => {
      // Payer gets credited
      const payerBalance = balances.get(payment.paidBy);
      if (payerBalance) {
        payerBalance.balance += payment.amount;
      }

      // Each split user gets debited their share
      payment.splits.forEach((split) => {
        if (!split.settled) {
          const userBalance = balances.get(split.userId);
          if (userBalance) {
            userBalance.balance -= split.amount;
          }
        }
      });
    });

    // Convert balances to debts
    const debts: DebtSummary[] = [];
    const creditors: { user: User; amount: number }[] = [];
    const debtors: { user: User; amount: number }[] = [];

    balances.forEach((balance) => {
      if (balance.balance > 0.01) {
        creditors.push({ user: balance.user, amount: balance.balance });
      } else if (balance.balance < -0.01) {
        debtors.push({ user: balance.user, amount: -balance.balance });
      }
    });

    // Match debtors with creditors (simplified algorithm)
    creditors.forEach((creditor) => {
      debtors.forEach((debtor) => {
        if (creditor.amount > 0.01 && debtor.amount > 0.01) {
          const amount = Math.min(creditor.amount, debtor.amount);
          debts.push({
            from: debtor.user,
            to: creditor.user,
            amount: Math.round(amount * 100) / 100,
          });
          creditor.amount -= amount;
          debtor.amount -= amount;
        }
      });
    });

    return debts;
  }, [payments, collaborators]);

  // Calculate total spent and splits
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const myTotalPaid = payments
    .filter((p) => p.paidBy === currentUserId)
    .reduce((sum, p) => sum + p.amount, 0);
  const myTotalOwed = payments.reduce((sum, p) => {
    const mySplit = p.splits.find((s) => s.userId === currentUserId);
    return sum + (mySplit && !mySplit.settled ? mySplit.amount : 0);
  }, 0);

  const handleDeletePayment = async (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePayment = async () => {
    if (!selectedPaymentId) return;
    try {
      await deletePayment(selectedPaymentId);
      setDeleteDialogOpen(false);
      setSelectedPaymentId(null);
      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to delete payment"
      );
    }
  };

  const handleSettleSplit = async (splitId: string) => {
    try {
      await settlePaymentSplit({ paymentSplitId: splitId });
      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to settle payment"
      );
    }
  };

  const handleSettleAll = async (fromUserId: string, toUserId: string) => {
    setSelectedDebt({ fromId: fromUserId, toId: toUserId });
    setSettleAllDialogOpen(true);
  };

  const confirmSettleAll = async () => {
    if (!selectedDebt) return;
    try {
      await settleAllDebts(trip.id, selectedDebt.fromId, selectedDebt.toId);
      setSettleAllDialogOpen(false);
      setSelectedDebt(null);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to settle debts");
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Across {payments.length} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">You Paid</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${myTotalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Your total contributions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">You Owe</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${myTotalOwed.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Unsettled amounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Settlement Summary */}
      {debtSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Settlement Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {debtSummary.map((debt, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <ArrowRightLeft className="h-5 w-5 text-gray-400" />
                  <span>
                    <span className="font-medium">
                      {debt.from.name || debt.from.email}
                    </span>
                    {" owes "}
                    <span className="font-medium">
                      {debt.to.name || debt.to.email}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">
                    ${debt.amount.toFixed(2)}
                  </span>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSettleAll(debt.from.id, debt.to.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Settle
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add Payment Form */}
      {canEdit && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Add Payment</CardTitle>
              <Button
                variant={showAddForm ? "outline" : "default"}
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? "Cancel" : "Add Payment"}
              </Button>
            </div>
          </CardHeader>
          {showAddForm && (
            <CardContent>
              <AddPaymentForm
                tripId={trip.id}
                collaborators={collaborators}
                onSuccess={() => {
                  setShowAddForm(false);
                  router.refresh();
                }}
              />
            </CardContent>
          )}
        </Card>
      )}

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No payments recorded yet.
              {canEdit && " Add a payment to start tracking expenses!"}
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg">
                        {payment.description}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Paid by {payment.payer.name || payment.payer.email}
                      </p>
                      {payment.category && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 rounded">
                          {payment.category}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ${payment.amount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.currency}
                      </div>
                    </div>
                  </div>

                  {/* Splits */}
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-600">
                      Split ({payment.splitType}):
                    </p>
                    {payment.splits.map((split) => (
                      <div
                        key={split.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="flex items-center gap-2">
                          {split.settled && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          {split.user.name || split.user.email}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            ${split.amount.toFixed(2)}
                          </span>
                          {!split.settled &&
                            canEdit &&
                            split.userId === currentUserId && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSettleSplit(split.id)}
                              >
                                Mark Settled
                              </Button>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {canEdit && (
                    <div className="border-t pt-3 flex justify-end gap-1">
                      <EditPaymentForm
                        payment={payment}
                        collaborators={collaborators}
                        onSuccess={() => router.refresh()}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePayment(payment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Payment Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedPaymentId(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeletePayment}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settle All Dialog */}
      <Dialog open={settleAllDialogOpen} onOpenChange={setSettleAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settle All Debts</DialogTitle>
            <DialogDescription>
              Mark all debts between these users as settled? This will mark all outstanding payment splits as completed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSettleAllDialogOpen(false);
                setSelectedDebt(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmSettleAll}>
              Settle All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
