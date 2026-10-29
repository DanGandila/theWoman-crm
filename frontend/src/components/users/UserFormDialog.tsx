import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Button from '@/components/ui/button';
import { FormField, inputClass, inputDisabledClass } from '@/components/ui/form-field';
import { ROLE_LABELS, type Role, type User } from '@/types';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.string().min(1),
});

// On edit the email is fixed and the password is optional (blank = unchanged)
const editSchema = createSchema.omit({ email: true, password: true }).extend({
  password: z.union([z.string().min(8, 'Password must be at least 8 characters'), z.literal('')]),
});

type FormData = z.infer<typeof createSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  isSubmitting?: boolean;
};

export default function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isSubmitting,
}: Props) {
  const isEdit = !!user;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: { name: '', email: '', password: '', role: 'MEMBER' },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      user
        ? { name: user.name, email: user.email, password: '', role: user.role }
        : { name: '', email: '', password: '', role: 'MEMBER' },
    );
  }, [open, user, reset]);

  const submit = handleSubmit(async (data) => {
    if (!isEdit) {
      await onSubmit(data);
      return;
    }
    // Only send the password when the admin actually typed a new one
    const { email, password, ...rest } = data;
    await onSubmit(password ? { ...rest, password } : rest);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEdit ? 'Edit user' : 'New user'}
        description={isEdit ? 'Update this account.' : 'Add someone to the team.'}
      >
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Name" error={errors.name?.message}>
            <input {...register('name')} className={inputClass} placeholder="Ana Popescu" />
          </FormField>

          {isEdit ? (
            <FormField label="Email" hint="The email cannot be changed.">
              <input value={user.email} disabled className={inputDisabledClass} />
            </FormField>
          ) : (
            <FormField label="Email" error={errors.email?.message}>
              <input
                {...register('email')}
                type="email"
                className={inputClass}
                placeholder="ana@thewoman.ro"
              />
            </FormField>
          )}

          <FormField
            label={isEdit ? 'New password' : 'Password'}
            error={errors.password?.message}
            hint={isEdit ? 'Leave blank to keep the current password.' : 'At least 8 characters.'}
          >
            <input
              {...register('password')}
              type="password"
              autoComplete="new-password"
              className={inputClass}
              placeholder="••••••••"
            />
          </FormField>

          <FormField label="Role">
            <select {...register('role')} className={inputClass}>
              {(Object.keys(ROLE_LABELS) as Role[]).map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </select>
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create user'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
