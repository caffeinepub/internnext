# InternNext

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- AI-powered resume tailoring: user pastes their resume + a job description, the app returns a tailored version with improvement suggestions
- Skill gap analysis: identify missing skills for the target role and suggest how to fill them
- Gamification system: XP points, levels, badges, and a progress dashboard
  - XP earned by: tailoring a resume, completing skill challenges, daily logins, achieving milestones
  - Levels: Intern Rookie, Rising Star, Top Candidate, Dream Intern (with visual progression)
  - Badges: First Resume, Skill Builder, Streak Master, etc.
- Resume history: store past tailoring sessions per user
- Skill challenges: short actionable tasks (e.g. "Add a quantified metric to your bullet") that award XP
- Leaderboard: show top users by XP (optional fun element)
- Dashboard: XP bar, level badge, badges earned, recent activity feed
- Landing page: hero section, feature highlights, CTA to get started

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend (Motoko):
   - User profile store: principal -> { xp, level, badges[], resumeHistory[] }
   - Resume session store: sessionId -> { originalResume, jobDescription, tailoredResume, skillGaps[], timestamp }
   - XP/leveling logic: addXP, getLevel, awardBadge
   - Skill challenges store: list of challenges, completion tracking per user
   - Leaderboard query: top N users by XP
   - HTTP outcall to Claude API for resume tailoring and skill gap analysis

2. Frontend (React + Tailwind):
   - Landing page with hero, features, how-it-works
   - Auth gate (Internet Identity)
   - Dashboard: XP bar, level, badges, recent sessions
   - Resume Tailor page: paste resume + JD, submit, view tailored result + skill gaps
   - Skill Challenges page: list of challenges, mark complete
   - Leaderboard page
   - Profile page
