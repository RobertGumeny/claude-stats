import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string; // No path means current page (not clickable)
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb navigation component
 * Shows current location in navigation hierarchy
 * PRD: "Breadcrumb navigation shows current location (e.g., 'Projects > MyProject')"
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted mb-6">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <span className="mx-2 text-subtle">/</span>
          )}
          {item.path ? (
            <Link
              to={item.path}
              className="hover:text-accent transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
