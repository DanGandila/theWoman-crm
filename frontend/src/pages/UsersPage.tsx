import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/axios';
import { apiErrorMessage } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { ROLE_LABELS, type Role, type User } from '@/types';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import UserFormDialog from '@/components/users/UserFormDialog';

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-primary/10 text-primary',
  MANAGER: 'bg-blue-100 text-blue-700',
  MEMBER: 'bg-slate-100 text-slate-600',
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'ADMIN';

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [error, setError] = useState('');

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/users', data),
    onSuccess: () => {
      invalidate();
      setCreating(false);
      setError('');
    },
    onError: (err) => setError(apiErrorMessage(err, 'Failed to create user')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/users/${id}`, data),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      setError('');
    },
    onError: (err) => setError(apiErrorMessage(err, 'Failed to update user')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Failed to delete user'));
      setDeleting(null);
    },
  });

  const handleSubmit = async (data: Record<string, unknown>) => {
    setError('');
    if (editing) await updateMutation.mutateAsync({ id: editing.id, data });
    else await createMutation.mutateAsync(data);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Users</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setError('');
              setCreating(true);
            }}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            New user
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {!isAdmin && (
        <p className="mb-4 text-sm text-muted-foreground">
          Only admins can add, edit or remove users.
        </p>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card divide-y">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>

              <Badge className={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Badge>

              <span className="hidden sm:block text-xs text-muted-foreground w-24 text-right">
                {format(new Date(user.createdAt), 'd MMM yyyy')}
              </span>

              {isAdmin && (
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setEditing(user);
                    }}
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label={`Edit ${user.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(user)}
                    disabled={user.id === currentUser?.id}
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 disabled:pointer-events-none"
                    aria-label={`Delete ${user.name}`}
                    title={user.id === currentUser?.id ? "You can't delete yourself" : undefined}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <UserFormDialog
        open={creating}
        onOpenChange={setCreating}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <UserFormDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        user={editing}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete user"
        description={`Delete "${deleting?.name}"? They will be unassigned from their projects and tasks.`}
        confirmLabel="Delete user"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
