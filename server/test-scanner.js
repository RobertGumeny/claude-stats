import { scanAllProjects } from './scanner.js';

console.log('Testing scanner...\n');

const startTime = Date.now();
const result = await scanAllProjects();
const duration = Date.now() - startTime;

if (!result.success) {
  console.error('❌ Scanner failed:');
  console.error(result.error);
  process.exit(1);
}

console.log('✅ Scanner succeeded!\n');
console.log(`Projects found: ${result.metadata.totalProjects}`);
console.log(`Scan duration: ${result.metadata.scanDurationMs}ms`);
console.log(`Total duration (including overhead): ${duration}ms\n`);

// Show first few projects as sample
const sampleSize = Math.min(3, result.projects.length);
if (result.projects.length > 0) {
  console.log(`Sample projects (showing ${sampleSize} of ${result.projects.length}):\n`);

  for (let i = 0; i < sampleSize; i++) {
    const project = result.projects[i];
    console.log(`  ${i + 1}. ${project.name}`);
    console.log(`     Sessions: ${project.totalSessions}`);
    console.log(`     Path: ${project.path}`);
    if (project.sessionFiles.length > 0) {
      console.log(`     Sample file: ${project.sessionFiles[0].filename}`);
    }
    console.log('');
  }
}

// Performance check
const performanceTarget = 3000; // 3 seconds
if (result.metadata.scanDurationMs < performanceTarget) {
  console.log(`✅ Performance: ${result.metadata.scanDurationMs}ms < ${performanceTarget}ms target`);
} else {
  console.log(`⚠️  Performance: ${result.metadata.scanDurationMs}ms > ${performanceTarget}ms target`);
}
