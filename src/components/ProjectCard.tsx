import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

/**
 * Individual project card showing summary stats
 * Displays: name, session count, total cost, last activity timestamp
 */
export function ProjectCard({ project, onClick }: ProjectCardProps) {
  // Format the cost to 4 decimal places as per PRD
  const formattedCost = `$${project.totalCost.toFixed(4)}`;

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
      className="bg-background-secondary border border-border-primary rounded-lg p-6 cursor-pointer hover:border-border-secondary transition-colors"
    >
      <h3 className="text-xl font-semibold text-text-primary mb-3">
        {project.name}
      </h3>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-text-tertiary text-sm">Sessions</span>
          <span className="text-text-secondary font-medium">
            {project.totalSessions}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-text-tertiary text-sm">Total Cost</span>
          <span className="text-accent-cost font-semibold">
            {formattedCost}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-text-tertiary text-sm">Last Activity</span>
          <span className="text-text-secondary text-sm">
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}
