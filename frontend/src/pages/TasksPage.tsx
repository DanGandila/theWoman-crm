import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Plus, Pencil, Trash2 } from 'lucide-react';
import { format, isPast } from 'date-fns';
import api from '@/lib/axios';
import { apiErrorMessage, cn } from '@/lib/utils';
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type Project,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/types';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import TaskFormDialog from '@/components/tasks/TaskFormDialog';
import { inputClass } from '@/components/ui/form-field';

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  IN_REVIEW: 'bg-purple-100 text-purple-700',
  DONE: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-sky-100 text-sky-700',
  HIGH: 'bg-amber-100 text-amber-800',
  URGENT: 'bg-red-100 text-red-700',
};

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectFilter = searchParams.get('project') ?? '';

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [error, setError] = useState('');

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then((r) => r.data),
  });

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', projectFilter],
    queryFn: () =>
      api
        .get('/tasks', { params: projectFilter ? { projectId: projectFilter } : undefined })
        .then((r) => r.data),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    // task counts live on the project cards
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/tasks', data),
    onSuccess: () => {
      invalidate();
      setCreating(false);
      setError('');
    },
    onError: (err) => setError(apiErrorMessage(err, 'Failed to create task')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/tasks/${id}`, data),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      setError('');
    },
    onError: (err) => setError(apiErrorMessage(err, 'Failed to update task')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Failed to delete task'));
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
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Tasks</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => {
            setError('');
            setCreating(true);
          }}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
          New task
        </Button>
      </div>

      {error && (
        <div className="mb-4 bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-5 max-w-xs">
        <select
          value={projectFilter}
          onChange={(e) => {
            const value = e.target.value;
            setSearchParams(value ? { project: value } : {});
          }}
          className={inputClass}
          aria-label="Filter by project"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.key} — {p.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="mb-4">
            {projectFilter ? 'No tasks in this project yet.' : 'No tasks yet.'}
          </p>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Create a task
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => {
            const overdue =
              task.dueDate &&
              task.status !== 'DONE' &&
              task.status !== 'CANCELLED' &&
              isPast(new Date(task.dueDate));

            return (
              <li
                key={task.id}
                className="bg-card border rounded-lg p-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {task.project && (
                      <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                        {task.project.key}
                      </span>
                    )}
                    <Badge className={STATUS_COLORS[task.status]}>
                      {TASK_STATUS_LABELS[task.status]}
                    </Badge>
                    <Badge className={PRIORITY_COLORS[task.priority]}>
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </Badge>
                  </div>

                  <p
                    className={cn(
                      'font-medium',
                      (task.status === 'DONE' || task.status === 'CANCELLED') &&
                        'line-through text-muted-foreground',
                    )}
                  >
                    {task.title}
                  </p>

                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                    {task.dueDate && (
                      <span className={cn(overdue && 'text-destructive font-medium')}>
                        Due {format(new Date(task.dueDate), 'd MMM yyyy')}
                      </span>
                    )}
                    {task.assignees.length > 0 && (
                      <span className="truncate">
                        {task.assignees.map((a) => a.name).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setEditing(task);
                    }}
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label={`Edit ${task.title}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(task)}
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${task.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <TaskFormDialog
        open={creating}
        onOpenChange={setCreating}
        defaultProjectId={projectFilter}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <TaskFormDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        task={editing}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete task"
        description={`Delete "${deleting?.title}"?`}
        confirmLabel="Delete task"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
