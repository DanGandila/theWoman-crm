import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Button from '@/components/ui/button';
import { FormField, inputClass, inputDisabledClass } from '@/components/ui/form-field';
import api from '@/lib/axios';
import { PROJECT_STATUS_LABELS, type Project, type ProjectStatus, type User } from '@/types';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  key: z
    .string()
    .min(2, 'Key must be at least 2 characters')
    .max(10, 'Key must be at most 10 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Key must be letters and numbers only'),
  status: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  responsibleId: z.string().optional(),
});

type FormData = z.infer<typeof createSchema>;

const EMPTY: FormData = {
  name: '',
  key: '',
  status: 'TODO',
  description: '',
  startDate: '',
  endDate: '',
  responsibleId: '',
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  isSubmitting?: boolean;
};

export default function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onSubmit,
  isSubmitting,
}: Props) {
  const isEdit = !!project;

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(isEdit ? createSchema.omit({ key: true }) : createSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      project
        ? {
            name: project.name,
            key: project.key,
            status: project.status,
            description: project.description ?? '',
            startDate: project.startDate?.slice(0, 10) ?? '',
            endDate: project.endDate?.slice(0, 10) ?? '',
            responsibleId: project.responsibleId ?? '',
          }
        : EMPTY,
    );
  }, [open, project, reset]);

  const submit = handleSubmit(async (data) => {
    const { key, ...rest } = data;
    await onSubmit(isEdit ? rest : { ...rest, key: key.toUpperCase() });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEdit ? 'Edit project' : 'New project'}
        description={isEdit ? 'Update project details.' : 'Create a new project.'}
      >
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Name" error={errors.name?.message}>
            <input {...register('name')} className={inputClass} placeholder="theWoman Platform" />
          </FormField>

          {isEdit ? (
            <FormField label="Key" hint="The project key cannot be changed.">
              <input value={project.key} disabled className={inputDisabledClass} />
            </FormField>
          ) : (
            <FormField
              label="Key"
              error={errors.key?.message}
              hint="Short unique ID, e.g. TW, WEB, OPS"
            >
              <input {...register('key')} className={inputClass} placeholder="TW" />
            </FormField>
          )}

          <FormField label="Status">
            <select {...register('status')} className={inputClass}>
              {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((value) => (
                <option key={value} value={value}>
                  {PROJECT_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Description">
            <textarea
              {...register('description')}
              rows={3}
              className={inputClass}
              placeholder="Optional"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Start date">
              <input type="date" {...register('startDate')} className={inputClass} />
            </FormField>
            <FormField label="End date">
              <input type="date" {...register('endDate')} className={inputClass} />
            </FormField>
          </div>

          <FormField label="Responsible">
            <select {...register('responsibleId')} className={inputClass}>
              <option value="">Nobody</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
