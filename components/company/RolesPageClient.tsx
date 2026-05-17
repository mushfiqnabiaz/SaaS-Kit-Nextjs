"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import type { PermissionKey } from "@/config/roles";
import { PermissionPicker } from "@/components/company/PermissionPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CompanyRoleRow } from "@/lib/data/company";
import { cn } from "@/lib/utils";

interface RolesPageClientProps {
  initialRoles: CompanyRoleRow[];
}

type EditorState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; role: CompanyRoleRow };

export function RolesPageClient({ initialRoles }: RolesPageClientProps) {
  const router = useRouter();
  const [roles, setRoles] = useState(initialRoles);

  useEffect(() => {
    setRoles(initialRoles);
  }, [initialRoles]);
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditor({ mode: "create" });
    setName("");
    setDescription("");
    setPermissions([]);
    setError(null);
  }

  function openEdit(role: CompanyRoleRow) {
    setEditor({ mode: "edit", role });
    setName(role.name);
    setDescription(role.description ?? "");
    setPermissions([...role.permissions]);
    setError(null);
  }

  function closeEditor() {
    setEditor({ mode: "closed" });
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      permissions,
    };

    const url =
      editor.mode === "edit" ? `/api/company/roles/${editor.role.id}` : "/api/company/roles";
    const method = editor.mode === "edit" ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as { error?: string | Record<string, unknown>; data?: CompanyRoleRow };

    setSubmitting(false);

    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Failed to save role");
      return;
    }

    closeEditor();
    router.refresh();
  }

  async function handleDelete(role: CompanyRoleRow) {
    if (role.isSystem) return;
    if (!window.confirm(`Delete role "${role.name}"?`)) return;

    const res = await fetch(`/api/company/roles/${role.id}`, { method: "DELETE" });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      window.alert(typeof json.error === "string" ? json.error : "Delete failed");
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== role.id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#E6EDF3]">Roles & permissions</h2>
          <p className="mt-1 text-sm text-[#8B949E]">
            Create custom roles and assign permissions for your team members.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="bg-[#6366F1] hover:bg-[#6366F1]/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          New role
        </Button>
      </div>

      {editor.mode !== "closed" ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[#30363D] bg-[#161B22] p-6 space-y-5"
        >
          <h3 className="text-sm font-semibold text-[#E6EDF3]">
            {editor.mode === "create" ? "Create role" : `Edit ${editor.role.name}`}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role-name">Name</Label>
              <Input
                id="role-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="company-input"
                disabled={editor.mode === "edit" && editor.role.isSystem}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-desc">Description</Label>
              <Input
                id="role-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
                className="company-input"
              />
            </div>
          </div>

          <PermissionPicker
            selected={permissions}
            onChange={setPermissions}
            disabled={editor.mode === "edit" && editor.role.isSystem}
          />

          {error ? <p className="text-sm text-[#F87171]">{error}</p> : null}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="border-[#30363D]" onClick={closeEditor}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || (editor.mode === "edit" && editor.role.isSystem)}
              className="bg-[#6366F1] hover:bg-[#6366F1]/90"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save role"}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-[#30363D]">
        <table className="w-full text-sm">
          <thead className="bg-[#161B22] text-left text-[#6E7681]">
            <tr>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Permissions</th>
              <th className="px-4 py-3 font-medium">Members</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363D] bg-[#0D1117]">
            {roles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[#8B949E]">
                  No custom roles yet. Create one to get started.
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id} className="hover:bg-[#161B22]/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-[#6366F1]" />
                      <div>
                        <p className="font-medium text-[#E6EDF3]">{role.name}</p>
                        {role.description ? (
                          <p className="text-xs text-[#6E7681]">{role.description}</p>
                        ) : null}
                        {role.isSystem ? (
                          <span className="mt-1 inline-block text-[10px] uppercase tracking-wider text-[#6E7681]">
                            System
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#8B949E]">{role.permissions.length}</td>
                  <td className="px-4 py-3 text-[#8B949E]">{role.memberCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(role)}
                        className={cn(
                          "rounded-md p-2 text-[#8B949E] hover:bg-[#21262D] hover:text-[#E6EDF3]",
                        )}
                        aria-label={`Edit ${role.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {!role.isSystem ? (
                        <button
                          type="button"
                          onClick={() => void handleDelete(role)}
                          className="rounded-md p-2 text-[#8B949E] hover:bg-[#21262D] hover:text-[#F87171]"
                          aria-label={`Delete ${role.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
