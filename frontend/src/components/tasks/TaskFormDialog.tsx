import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Button from '@/components/ui/button';
import { FormField, inputClass } from '@/components/ui/form-field';
import api from '@/lib/axios';
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type Project,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type User,
} from '@/types';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  projectId: z.string().min(1, 'Pick a project'),
  description: z.string().optional(),
  status: z.string().min(1),
  priority: z.string().min(1),
  dueDate: z.string().optional(),
  assigneeIds: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  /** Preselected project when creating from a filtered list. */
  defaultProjectId?: string;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  isSubmitting?: boolean;
};

export default function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaultProjectId,
  onSubmit,
  isSubmitting,
}: Props) {
  const isEdit = !!task;

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then((r) => r.data),
    enabled: open,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      projectId: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: '',
      assigneeIds: [],
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      task
        ? {
            title: task.title,
            projectId: task.projectId,
            description: task.description ?? '',
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate?.slice(0, 10) ?? '',
            assigneeIds: task.assignees.map((a) => a.id),
          }
        : {
            title: '',
            projectId: defaultProjectId ?? '',
            description: '',
            status: 'TODO',
            priority: 'MEDIUM',
            dueDate: '',
            assigneeIds: [],
          },
    );
  }, [open, task, defaultProjectId, reset]);

  const submit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEdit ? 'Edit task' : 'New task'}
        description={isEdit ? 'Update task details.' : 'Add a task to a project.'}
      >
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Title" error={errors.title?.message}>
            <input {...register('title')} className={inputClass} placeholder="What needs doing?" />
          </FormField>

          <FormField label="Project" error={errors.projectId?.message}>
            <select {...register('projectId')} className={inputClass}>
              <option value="">Select a project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.key} — {p.name}
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
            <FormField label="Status">
              <select {...register('status')} className={inputClass}>
                {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((value) => (
                  <option key={value} value={value}>
                    {TASK_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Priority">
              <select {...register('priority')} className={inputClass}>
                {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((value) => (
                  <option key={value} value={value}>
                    {TASK_PRIORITY_LABELS[value]}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Due date">
            <input type="date" {...register('dueDate')} className={inputClass} />
          </FormField>

          <FormField label="Assignees" hint="Tick everyone who should work on this.">
            <Controller
              name="assigneeIds"
              control={control}
              render={({ field }) => (
                <div className="border rounded-md max-h-40 overflow-y-auto divide-y">
                  {users.length === 0 && (
                    <p className="text-sm text-muted-foreground px-3 py-2">No users yet.</p>
                  )}
                  {users.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        checked={field.value.includes(u.id)}
                        onChange={(e) =>
                          field.onChange(
                            e.target.checked
                              ? [...field.value, u.id]
                              : field.value.filter((id) => id !== u.id),
                          )
                        }
                      />
                      {u.name}
                    </label>
                  ))}
                </div>
              )}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
