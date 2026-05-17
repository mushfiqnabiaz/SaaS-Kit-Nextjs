"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { SessionsPanel } from "@/components/app/SessionsPanel";

const profileFormSchema = z
  .object({
    name: z.string().min(2).optional(),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .optional()
      .or(z.literal("")),
    currentPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return Boolean(data.currentPassword && data.currentPassword.length > 0);
      }
      return true;
    },
    { message: "Current password is required", path: ["currentPassword"] },
  );

type ProfileFormInput = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  userId: string;
  defaultName: string;
  email: string;
}

export function ProfileForm({ userId, defaultName, email }: ProfileFormProps) {
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: defaultName, password: "", currentPassword: "" },
  });

  async function onSubmit(values: ProfileFormInput) {
    const payload: Record<string, string> = {};
    if (values.name) payload.name = values.name;
    if (values.password) {
      payload.password = values.password;
      payload.currentPassword = values.currentPassword ?? "";
    }

    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await res.json()) as { error?: string };

    if (!res.ok) {
      setError("root", {
        message: typeof json.error === "string" ? json.error : "Update failed",
      });
      return;
    }

    router.refresh();
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return;

    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      await signOut({ callbackUrl: "/login" });
    }
  }

  return (
    <div className="space-y-10">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-5">
        <h2 className="text-lg font-semibold">Profile</h2>

        <div className="space-y-2">
          <Label>Avatar</Label>
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-border bg-muted text-sm text-muted-foreground">
            Soon
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={email} disabled className="bg-muted" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <PasswordInput id="currentPassword" {...register("currentPassword")} />
          {errors.currentPassword ? (
            <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput id="password" {...register("password")} />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        {errors.root ? <p className="text-sm text-destructive">{errors.root.message}</p> : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save profile"
          )}
        </Button>
      </form>

      <SessionsPanel />

      <section className="max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="font-semibold text-destructive">Delete account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Type <strong>DELETE</strong> to confirm permanent deactivation of your account.
        </p>
        <Input
          className="mt-4"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder="DELETE"
        />
        <Button
          type="button"
          variant="destructive"
          className="mt-4"
          disabled={deleteConfirm !== "DELETE"}
          onClick={handleDeleteAccount}
        >
          Delete my account
        </Button>
      </section>
    </div>
  );
}
