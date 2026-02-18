/**
 * Test component to verify types can be imported and used in React components
 * This file can be deleted after verification
 */

import type { Project, Session, Message } from '../types';
import { formatCost } from '../utils/costCalculator';

interface Props {
  project?: Project;
  session?: Session;
  message?: Message;
}

export function TypeTest({ project, session, message }: Props) {
  return (
    <div>
      {project && (
        <div>
          <h2>{project.name}</h2>
          <p>Sessions: {project.totalSessions}</p>
          <p>Cost: {formatCost(project.totalCost)}</p>
        </div>
      )}
      {session && (
        <div>
          <h3>{session.filename}</h3>
          <p>Messages: {session.messageCount}</p>
          <p>Cost: {formatCost(session.totalCost)}</p>
        </div>
      )}
      {message && (
        <div>
          <p>Role: {message.role}</p>
          <p>Model: {message.model}</p>
          <p>Cost: {formatCost(message.cost)}</p>
        </div>
      )}
    </div>
  );
}
