/**
 * Barrel export for all agents.
 * Import from '@/lib/agents' — keeps consumer imports clean.
 *
 * Each agent lives in its own file for maintainability.
 */

export * from './types'

export { runJobSearchAgent } from './job-searcher'
export { runJobMatcher } from './job-matcher'
export { runResumeBuilder } from './resume-builder'
export { runCoverLetterWriter } from './cover-letter-writer'
export { runScreeningAgent } from './screening-agent'
export { runInterviewPrepAgent } from './interview-prep'
export { runNetworkingMessageGenerator } from './networking-message'
export { runATSScoring } from './ats-scorer'
export { runFollowUpGenerator } from './follow-up-writer'
