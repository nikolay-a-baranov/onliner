# Codex Integration Instruction

Integrate the launcher MVP into the existing bookmarklet project.

Requirements:

- Keep one launcher entrypoint
- Do not introduce unnecessary abstractions
- Follow JAVASCRIPT.md strictly
- Preserve existing project structure where possible
- Reuse existing toolbar/button rendering if already present
- Reuse existing tool launch logic instead of duplicating execution code
- Keep scenarios/config declarative
- Keep DOM side effects localized
- Do not introduce framework-style architecture

Tasks:

1. Integrate launcher-scenarios-mvp.js into existing build/dev pipeline
2. Replace placeholder tool definitions with real project tools
3. Connect launcher buttons to existing bookmarklet actions
4. Preserve role/surface/scenario separation
5. Keep unsupported pages silent or minimal
6. Avoid global leakage except one explicit launcher key if needed
7. Keep file structure minimal unless launcher grows substantially

Important:

- Prefer extending existing toolbar system over parallel UI
- Prefer composition over inheritance
- Avoid speculative scalability
- Keep launcher deterministic and easy to edit
