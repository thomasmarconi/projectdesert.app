"use client";

import { useState } from "react";
import { UserRole } from "@/types/enums";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, ShieldAlert, User, Ban, CheckCircle } from "lucide-react";
import {
  updateUserRole,
  toggleUserBan,
  UserData,
} from "@/lib/services/adminService";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UsersTableProps {
  users: UserData[];
  currentUserId: number;
}

export default function UsersTable({ users, currentUserId }: UsersTableProps) {
  const [localUsers, setLocalUsers] = useState(users);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    setIsUpdating(userId);
    try {
      await updateUserRole(userId, newRole);
      setLocalUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user,
        ),
      );
      toast.success("User role updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update role",
      );
    } finally {
      setIsUpdating(null);
    }
  };

  const handleBanToggle = async (user: UserData) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const confirmBanToggle = async () => {
    if (!selectedUser) return;

    setIsUpdating(selectedUser.id);
    try {
      await toggleUserBan(selectedUser.id, !selectedUser.isBanned);
      setLocalUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id
            ? { ...user, isBanned: !user.isBanned }
            : user,
        ),
      );
      toast.success(
        selectedUser.isBanned
          ? "User unbanned successfully"
          : "User banned successfully",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update ban status",
      );
    } finally {
      setIsUpdating(null);
      setBanDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return (
          <Badge
            variant="default"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case UserRole.MODERATOR:
        return (
          <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
            <ShieldAlert className="w-3 h-3 mr-1" />
            Moderator
          </Badge>
        );
      case UserRole.USER:
        return (
          <Badge variant="secondary">
            <User className="w-3 h-3 mr-1" />
            User
          </Badge>
        );
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">User Management</CardTitle>
          <CardDescription>
            Manage user roles and permissions across the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-75">User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className={`transition-colors ${
                      user.isBanned
                        ? "opacity-60 bg-red-50/50 dark:bg-red-950/10"
                        : ""
                    }`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                          <AvatarImage
                            src={user.image || undefined}
                            referrerPolicy="no-referrer"
                          />
                          <AvatarFallback className="bg-linear-to-br from-purple-400 to-blue-400 text-white">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.name || "Unknown User"}
                            {user.id === currentUserId && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                You
                              </Badge>
                            )}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          handleRoleChange(user.id, value as UserRole)
                        }
                        disabled={
                          isUpdating === user.id || user.id === currentUserId
                        }
                      >
                        <SelectTrigger className="w-35">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UserRole.USER}>User</SelectItem>
                          <SelectItem value={UserRole.MODERATOR}>
                            Moderator
                          </SelectItem>
                          <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getRoleBadge(user.role as UserRole)}
                        {user.isBanned && (
                          <Badge variant="destructive" className="w-fit">
                            <Ban className="w-3 h-3 mr-1" />
                            Banned
                          </Badge>
                        )}
                        {user.emailVerified && !user.isBanned && (
                          <Badge
                            variant="outline"
                            className="w-fit text-green-600 border-green-600"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col gap-1 text-sm">
                        <span className="text-muted-foreground">
                          {user.userAsceticismsCount} practices
                        </span>
                        <span className="text-muted-foreground">
                          {user.groupMembersCount} groups
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={user.isBanned ? "default" : "destructive"}
                        size="sm"
                        onClick={() => handleBanToggle(user)}
                        disabled={
                          isUpdating === user.id || user.id === currentUserId
                        }
                      >
                        {user.isBanned ? "Unban" : "Ban"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.isBanned ? "Unban User" : "Ban User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.isBanned
                ? `Are you sure you want to unban ${
                    selectedUser?.name || "this user"
                  }? They will regain access to the platform.`
                : `Are you sure you want to ban ${
                    selectedUser?.name || "this user"
                  }? They will lose access to the platform.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBanToggle}
              className={
                selectedUser?.isBanned
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {selectedUser?.isBanned ? "Unban" : "Ban"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
