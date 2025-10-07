"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Share2,
  UserPlus,
  X,
  Mail,
  Crown,
  Shield,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { sendInvite } from "@/lib/actions/send-invite";
import { cancelInvite } from "@/lib/actions/cancel-invite";
import { removeShare } from "@/lib/actions/remove-share";
import { updateShareRole } from "@/lib/actions/update-share-role";
import Image from "next/image";

interface Collaborator {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  shareId: string | null;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
}

interface ShareTripDialogProps {
  tripId: string;
  collaborators: Collaborator[];
  pendingInvites: PendingInvite[];
  currentUserId: string;
  isOwner: boolean;
  canManageSharing: boolean;
}

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  editor: Edit,
  viewer: Eye,
};

const ROLE_COLORS = {
  owner: "text-yellow-600 bg-yellow-50 border-yellow-200",
  admin: "text-purple-600 bg-purple-50 border-purple-200",
  editor: "text-blue-600 bg-blue-50 border-blue-200",
  viewer: "text-gray-600 bg-gray-50 border-gray-200",
};

const ROLE_LABELS = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export default function ShareTripDialog({
  tripId,
  collaborators,
  pendingInvites,
  currentUserId,
  isOwner,
  canManageSharing,
}: ShareTripDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [isSendingInvite, startSendInviteTransition] = useTransition();
  const [isRemovingShare, startRemoveShareTransition] = useTransition();
  const [isCancelingInvite, startCancelInviteTransition] = useTransition();
  const [isUpdatingRole, startUpdateRoleTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendInvite = () => {
    setError(null);
    setSuccess(null);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    startSendInviteTransition(async () => {
      const result = await sendInvite(tripId, email, role);

      if (result.success) {
        setSuccess("Invite sent successfully!");
        setEmail("");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to send invite");
      }
    });
  };

  const handleCancelInvite = (inviteId: string) => {
    startCancelInviteTransition(async () => {
      const result = await cancelInvite(inviteId, tripId);
      if (!result.success) {
        setError(result.error || "Failed to cancel invite");
      }
    });
  };

  const handleRemoveShare = (shareId: string) => {
    startRemoveShareTransition(async () => {
      const result = await removeShare(shareId, tripId);
      if (!result.success) {
        setError(result.error || "Failed to remove user");
      }
    });
  };

  const handleUpdateRole = (
    shareId: string,
    newRole: "viewer" | "editor" | "admin"
  ) => {
    startUpdateRoleTransition(async () => {
      const result = await updateShareRole(shareId, tripId, newRole);
      if (!result.success) {
        setError(result.error || "Failed to update role");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Trip</DialogTitle>
          <DialogDescription>
            Invite people to collaborate on this trip. They can view, edit, or
            manage depending on their role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite Form */}
          {canManageSharing && (
            <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <UserPlus className="h-4 w-4" />
                Invite by Email
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                  {success}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="friend@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={isSendingInvite}
                />
                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as "viewer" | "editor")
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={isSendingInvite}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  {isOwner && <option value="admin">Admin</option>}
                </select>
                <Button
                  onClick={handleSendInvite}
                  disabled={isSendingInvite}
                  className="whitespace-nowrap h-[38px]"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isSendingInvite ? "Sending..." : "Send Invite"}
                </Button>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  <strong>Viewer:</strong> Can view all trip details
                </p>
                <p>
                  <strong>Editor:</strong> Can add, edit, and delete locations,
                  accommodations, flights, and expenses
                </p>
                {isOwner && (
                  <p>
                    <strong>Admin:</strong> Can manage sharing and all editor
                    permissions
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Current Collaborators */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">
              Collaborators ({collaborators.length})
            </h3>

            <div className="space-y-2">
              {collaborators.map((collaborator) => {
                const RoleIcon =
                  ROLE_ICONS[collaborator.role as keyof typeof ROLE_ICONS] ||
                  Eye;
                const roleColor =
                  ROLE_COLORS[collaborator.role as keyof typeof ROLE_COLORS] ||
                  ROLE_COLORS.viewer;
                const isCurrentUser = collaborator.id === currentUserId;

                return (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {collaborator.image ? (
                        <Image
                          src={collaborator.image}
                          alt={collaborator.name || "User"}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {(collaborator.name ||
                            collaborator.email)[0].toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">
                            {collaborator.name || "User"}
                            {isCurrentUser && (
                              <span className="text-gray-500 text-sm">
                                (You)
                              </span>
                            )}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {collaborator.email}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Role Badge/Selector */}
                        {canManageSharing &&
                        collaborator.role !== "owner" &&
                        !isCurrentUser &&
                        collaborator.shareId ? (
                          <select
                            value={collaborator.role}
                            onChange={(e) =>
                              handleUpdateRole(
                                collaborator.shareId!,
                                e.target.value as "viewer" | "editor" | "admin"
                              )
                            }
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${roleColor} cursor-pointer`}
                            disabled={isUpdatingRole}
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            {isOwner && <option value="admin">Admin</option>}
                          </select>
                        ) : (
                          <div
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${roleColor}`}
                          >
                            <RoleIcon className="h-3 w-3" />
                            {
                              ROLE_LABELS[
                                collaborator.role as keyof typeof ROLE_LABELS
                              ]
                            }
                          </div>
                        )}

                        {/* Remove Button */}
                        {canManageSharing &&
                          collaborator.role !== "owner" &&
                          !isCurrentUser &&
                          collaborator.shareId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveShare(collaborator.shareId!)
                              }
                              disabled={isRemovingShare}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Invites */}
          {canManageSharing && pendingInvites.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                Pending Invites ({pendingInvites.length})
              </h3>

              <div className="space-y-2">
                {pendingInvites.map((invite) => {
                  const RoleIcon =
                    ROLE_ICONS[invite.role as keyof typeof ROLE_ICONS] || Eye;
                  const roleColor =
                    ROLE_COLORS[invite.role as keyof typeof ROLE_COLORS] ||
                    ROLE_COLORS.viewer;

                  return (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-yellow-50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Mail className="h-10 w-10 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {invite.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            Invited{" "}
                            {new Date(invite.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${roleColor}`}
                          >
                            <RoleIcon className="h-3 w-3" />
                            {
                              ROLE_LABELS[
                                invite.role as keyof typeof ROLE_LABELS
                              ]
                            }
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelInvite(invite.id)}
                            disabled={isCancelingInvite}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
