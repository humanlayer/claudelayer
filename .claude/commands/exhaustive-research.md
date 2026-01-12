---
name: exhaustive-research
description: launch lots of subagents
model: sonnet
---

# launch.md

1. list the directories in `./humanlayer`
2. for each of the directories (excluding `.claude`), use the `Task` tool IN PARALLEL to launch a general-purpose agent with the directory name, and instructions to:
        - use `mcp__agent-launch` to launch the `codebase-analyzer` and `codebase-locator` agents to locate the key parts of the codebase. Wait for it to finish
        - for each of the key parts of the codebase, use `mcp__agent-launch` to launch the `codebase-analyzer` and `codebase-pattern-filter` to understand the key functions and patterns of the codebase
3. wait for all the tool calls to finish
4. summarize your findings in a markdown document.
