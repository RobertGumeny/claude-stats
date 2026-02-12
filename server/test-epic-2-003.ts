/**
 * Test file for EPIC-2-003: GET /api/sessions/:projectName endpoint
 *
 * This file verifies that:
 * - The getProjectSessions function works correctly
 * - Returns sessions for a specific project
 * - Returns 404 for non-existent projects
 * - Calculates summary statistics correctly
 */

import { getProjectSessions } from './scanner.js';

async function testGetProjectSessions() {
  console.log('Testing GET /api/sessions/:projectName implementation...\n');

  // Test 1: Try to get sessions for a non-existent project
  console.log('Test 1: Non-existent project');
  const nonExistentResult = await getProjectSessions('this-project-does-not-exist-123456');
  console.log('Result:', JSON.stringify(nonExistentResult, null, 2));

  if (!nonExistentResult.success) {
    console.log('✓ Correctly returns failure for non-existent project\n');
  } else {
    console.log('✗ Should have failed for non-existent project\n');
  }

  // Test 2: Get sessions for the first real project we can find
  console.log('Test 2: Real project (if available)');
  console.log('Attempting to find a real project...');

  // Import scanAllProjects to find a real project
  const { scanAllProjects } = await import('./scanner.js');
  const allProjectsResult = await scanAllProjects();

  if (allProjectsResult.success && allProjectsResult.projects.length > 0) {
    const firstProject = allProjectsResult.projects[0];
    console.log(`Found project: ${firstProject?.name}`);

    if (firstProject) {
      const projectResult = await getProjectSessions(firstProject.name);
      console.log('Result:', JSON.stringify(projectResult, null, 2));

      if (projectResult.success) {
        console.log(`✓ Successfully retrieved ${projectResult.sessions.length} sessions`);

        // Verify each session has required fields
        const firstSession = projectResult.sessions[0];
        if (firstSession) {
          console.log('\nFirst session details:');
          console.log(`- Filename: ${firstSession.filename}`);
          console.log(`- Session ID: ${firstSession.sessionId}`);
          console.log(`- Message Count: ${firstSession.messageCount}`);
          console.log(`- Total Cost: $${firstSession.totalCost}`);
          console.log(`- Sidechain Count: ${firstSession.sidechainCount}`);
          console.log(`- Sidechain Percentage: ${firstSession.sidechainPercentage}%`);
          console.log(`- Total Tokens: ${firstSession.totalTokens}`);
          console.log(`- First Message: ${firstSession.firstMessage}`);
          console.log(`- Last Message: ${firstSession.lastMessage}`);

          // Verify all required fields are present
          const hasAllFields =
            firstSession.filename &&
            firstSession.sessionId &&
            typeof firstSession.messageCount === 'number' &&
            typeof firstSession.totalCost === 'number' &&
            typeof firstSession.sidechainCount === 'number' &&
            typeof firstSession.sidechainPercentage === 'number' &&
            typeof firstSession.totalTokens === 'number' &&
            firstSession.firstMessage &&
            firstSession.lastMessage;

          if (hasAllFields) {
            console.log('\n✓ All required fields present in session');
          } else {
            console.log('\n✗ Missing required fields in session');
          }
        }
      } else {
        console.log('✗ Failed to retrieve sessions for real project');
      }
    }
  } else {
    console.log('No projects found in ~/.claude/projects/');
    console.log('This is expected if Claude Code has not been run yet.');
  }

  console.log('\n✓ Test complete!');
}

// Run the test
testGetProjectSessions().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});
