# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](0.1.0) YYYY-MM-DD

### Added
- Implemented GET /api/sessions/:projectName endpoint that returns all sessions for a specific project with summary statistics
- Implemented Express server with GET /api/projects endpoint that scans all projects and returns aggregated summary data including totalCost and lastActivity
- feat(backend): convert all backend code to TypeScript with comprehensive type definitions
- feat: Define TypeScript interfaces for Project, Session, SessionDetail, and Message types
- feat: EPIC-1-004 - Implement cost calculator utility with accurate Claude Sonnet 4.5 pricing
- feat(parser): implement robust JSONL parser with error handling
- feat(server): implement file system scanner for Claude Code project discovery
- Set up Vite + React 19 + TypeScript project with Tailwind CSS 4 and folder structure (src/components, src/utils, src/types, server/)

- Initial project setup with orchestrator framework
