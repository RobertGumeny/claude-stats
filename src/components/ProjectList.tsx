import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../types';
import { ProjectCard } from './ProjectCard';

interface ProjectListProps {
  projects: Project[];
}

type SortOption = 'cost' | 'recent' | 'alphabetical' | 'session-count';

/**
 * Project List view component
 * Displays all projects with search bar and sorting options
 * PRD: Most expensive (default), Most recent, Alphabetical
 */
export function ProjectList({ projects }: ProjectListProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('cost');

  const handleProjectClick = (projectName: string) => {
    navigate(`/project/${encodeURIComponent(projectName)}`);
  };

  // Real-time filtering based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return projects;
    }

    const query = searchQuery.toLowerCase();
    return projects.filter(project =>
      project.name.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  // Sort filtered projects based on selected option
  const sortedProjects = useMemo(() => {
    const sorted = [...filteredProjects];

    switch (sortBy) {
      case 'cost':
        // Most expensive first (default)
        return sorted.sort((a, b) => b.totalCost - a.totalCost);

      case 'recent':
        // Most recent activity first
        return sorted.sort((a, b) =>
          new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        );

      case 'alphabetical':
        // A-Z by project name
        return sorted.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );

      case 'session-count':
        // Most sessions first
        return sorted.sort((a, b) => b.totalSessions - a.totalSessions);

      default:
        return sorted;
    }
  }, [filteredProjects, sortBy]);

  return (
    <div className="space-y-6">
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-subtle focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="sm:w-64">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-accent transition-colors cursor-pointer"
          >
            <option value="cost">Most Expensive</option>
            <option value="recent">Most Recent</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="session-count">Most Sessions</option>
          </select>
        </div>
      </div>

      {/* Project Cards Grid */}
      {sortedProjects.length === 0 ? (
        <div className="bg-secondary border border-border rounded-lg p-12 text-center">
          <div className="inline-block mb-4 text-subtle">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <p className="text-subtle text-lg">
            {searchQuery ? 'No projects match your search' : 'No projects found'}
          </p>
          {!searchQuery && (
            <p className="text-subtle text-sm mt-2">
              No Claude Code projects detected. Start a session to see it here.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProjects.map((project) => (
            <ProjectCard
              key={project.name}
              project={project}
              onClick={() => handleProjectClick(project.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
