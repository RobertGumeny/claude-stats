import { Project } from '../types';
import { formatCost } from '../utils/costCalculator';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

/**
 * Individual project card showing summary stats
 * Displays: name, session count, total cost, last activity timestamp
 */
export function ProjectCard({ project, onClick }: ProjectCardProps) {
  // Format the cost with default 2 decimal places for readability
  const formattedCost = formatCost(project.totalCost);

  // Format last activity timestamp to readable format
  const lastActivityDate = new Date(project.lastActivity);
  const formattedDate = lastActivityDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      onClick={onClick}
      className="bg-secondary border border-border rounded-lg p-6 cursor-pointer hover:border-border-secondary transition-colors"
    >
      <h3 className="text-xl font-semibold text-foreground mb-3">
        {project.name}
      </h3>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-subtle text-sm">Sessions</span>
          <span className="text-muted font-medium">
            {project.totalSessions}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-subtle text-sm">Total Cost</span>
          <span className="text-success font-semibold">
            {formattedCost}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-subtle text-sm">Last Activity</span>
          <span className="text-muted text-sm">
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}
