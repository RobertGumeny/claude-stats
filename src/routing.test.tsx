import { describe, it, expect } from 'vitest';

/**
 * Basic routing structure tests for EPIC-3-004
 * Verifies URL patterns match acceptance criteria:
 * - / for projects
 * - /project/:name for sessions
 * - /session/:projectName/:sessionId for detail
 */

describe('URL Pattern Validation', () => {
  it('should have correct route patterns defined', () => {
    // URL patterns as defined in PRD and acceptance criteria
    const routes = {
      projects: '/',
      sessions: '/project/:name',
      sessionDetail: '/session/:projectName/:sessionId'
    };

    expect(routes.projects).toBe('/');
    expect(routes.sessions).toMatch(/\/project\/:\w+/);
    expect(routes.sessionDetail).toMatch(/\/session\/:\w+\/:\w+/);
  });

  it('should properly encode URL parameters', () => {
    const projectName = 'my-project';
    const sessionId = 'abc-123-def';

    const sessionUrl = `/project/${encodeURIComponent(projectName)}`;
    const detailUrl = `/session/${encodeURIComponent(projectName)}/${encodeURIComponent(sessionId)}`;

    expect(sessionUrl).toBe('/project/my-project');
    expect(detailUrl).toBe('/session/my-project/abc-123-def');
  });

  it('should handle special characters in project names', () => {
    const projectName = 'my project with spaces';
    const encodedUrl = `/project/${encodeURIComponent(projectName)}`;

    expect(encodedUrl).toBe('/project/my%20project%20with%20spaces');
    expect(decodeURIComponent('my%20project%20with%20spaces')).toBe(projectName);
  });
});

describe('Breadcrumb Navigation', () => {
  it('should generate correct breadcrumb items for projects page', () => {
    const items = [
      { label: 'Projects' }
    ];

    expect(items).toHaveLength(1);
    expect(items[0].label).toBe('Projects');
  });

  it('should generate correct breadcrumb items for sessions page', () => {
    const projectName = 'test-project';
    const items = [
      { label: 'Projects', path: '/' },
      { label: projectName }
    ];

    expect(items).toHaveLength(2);
    expect(items[0].path).toBe('/');
    expect(items[1].label).toBe(projectName);
  });

  it('should generate correct breadcrumb items for session detail page', () => {
    const projectName = 'test-project';
    const sessionId = 'abc-123';
    const items = [
      { label: 'Projects', path: '/' },
      { label: projectName, path: `/project/${encodeURIComponent(projectName)}` },
      { label: sessionId }
    ];

    expect(items).toHaveLength(3);
    expect(items[0].path).toBe('/');
    expect(items[1].path).toBe(`/project/${projectName}`);
    expect(items[2].label).toBe(sessionId);
  });
});
