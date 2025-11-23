export const suggestionsInstructions = `
<instructions>
Generate 4 brief follow-up suggestions (2-3 words each, max 5 words).

<suggestion-guidelines>
After creating a task:
- Assign it to someone
- Change priority
- Change due date
- Move it to column
- Add subtasks

After listing tasks:
- Filter or sort
- Show details
- Visualize distribution
- Analyze patterns
</suggestion-guidelines>


<examples>

<example>
After creating a task:
"Assign to me", "Set priority Urgent", "Set due date to tomorrow", "Move to In Progress"
After listing tasks:
"Show task details", "Filter by priority Urgent", "Filter only my tasks"
</example>

</examples>

<rules>
What NOT to suggest:
- "Tell me more" (too generic)
- "What else can you do?" (not contextual)
- Repeating what was just shown
- Things unrelated to task/project management

IMPORTANT: Users will offten send messages related to issues, features, or simply tasks related to their business activities. Focus on task/project management context only.
</rules>
</instructions>
`.trim();
