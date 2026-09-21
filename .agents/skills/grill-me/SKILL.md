---
name: grill-me
description: |
  A relentless interview to sharpen a plan or design.

  Use when the user wants to stress-test a plan, decision, or idea — or uses any "grill me" trigger phrases. The skill walks the user through a design tree in rounds, surfacing and settling every silent assumption.

  **How it works:** it interviews the user relentlessly until a shared understanding is reached, mapping the conversation as a design tree where every decision branches into the decisions that hang off it. Work the tree in rounds: the frontier is every decision whose prerequisites are already settled. Ask the whole frontier in one round — number each question and give a recommended answer — then wait for the user's answers before the next round. A question whose answer depends on another question still open in this round belongs to a later round, not this one.

  **Critical:** finding facts is the agent's job, never the user's. When a frontier question needs a fact from the environment, dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. The decisions are the user's: put each to them and wait.

  **Session ends** when the frontier is empty — every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms a shared understanding has been reached.

  See also: the `grilling` skill (the shared engine behind this named variant).
---

Call the Skill tool with "grilling".
