import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, CheckSquare, UserCircle, Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/axios';
import { apiErrorMessage } from '@/lib/utils';
import { PROJECT_STATUS_LABELS, type Project, type ProjectStatus } from '@/types';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import ProjectFormDialog from '@/components/projects/ProjectFormDialog';

const STATUS_COLORS: Record<ProjectStatus, string> = {
  TODO: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  ON_HOLD: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [error, setError] = useState('');

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then((r) => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['projects'] });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/projects', data),
    onSuccess: () => {
      invalidate();
      setCreating(false);
      setError('');
    },
    onError: (err) => setError(apiErrorMessage(err, 'Failed to create project')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/projects/${id}`, data),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      setError('');
    },
    onError: (err) => setError(apiErrorMessage(err, 'Failed to update project')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Failed to delete project'));
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
          <h2 className="text-xl md:text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
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
          New project
        </Button>
      </div>

      {error && (
        <div className="mb-4 bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="mb-4">No projects yet.</p>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-card border rounded-lg p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      {project.key}
                    </span>
                    <Badge className={STATUS_COLORS[project.status]}>
                      {PROJECT_STATUS_LABELS[project.status]}
                    </Badge>
                  </div>
                  <h3 className="font-semibold mt-2 truncate">{project.name}</h3>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setEditing(project);
                    }}
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label={`Edit ${project.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(project)}
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${project.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {project.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                  {project.description}
                </p>
              )}

              {(project.startDate || project.endDate) && (
                <p className="text-xs text-muted-foreground mb-3">
                  {project.startDate ? format(new Date(project.startDate), 'd MMM yyyy') : '—'}
                  {' → '}
                  {project.endDate ? format(new Date(project.endDate), 'd MMM yyyy') : '—'}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t mt-auto">
                <button
                  type="button"
                  onClick={() => navigate(`/tasks?project=${project.id}`)}
                  className="flex items-center gap-1 hover:text-primary hover:underline"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  {project._count?.tasks ?? 0} tasks
                </button>
                {project.responsible && (
                  <span className="flex items-center gap-1 truncate">
                    <UserCircle className="h-3.5 w-3.5 shrink-0" />
                    {project.responsible.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectFormDialog
        open={creating}
        onOpenChange={setCreating}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <ProjectFormDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        project={editing}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete project"
        description={`Delete "${deleting?.name}"? All of its tasks will be deleted too.`}
        confirmLabel="Delete project"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
