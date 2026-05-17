"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCompanySchema, type UpdateCompanyInput } from "@/lib/validations/company";

interface CompanySettingsFormProps {
  companyId: string;
  defaultName: string;
}

export function CompanySettingsForm({ companyId, defaultName }: CompanySettingsFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<UpdateCompanyInput>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: { name: defaultName },
  });

  async function onSubmit(values: UpdateCompanyInput) {
    const res = await fetch(`/api/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Company name</Label>
        <Input id="name" {...register("name")} />
        {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label>Logo</Label>
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
          Logo upload — coming soon
        </div>
      </div>

      {errors.root ? <p className="text-sm text-destructive">{errors.root.message}</p> : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    </form>
  );
}
