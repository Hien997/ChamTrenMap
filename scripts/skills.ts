#!/usr/bin/env node
/**
 * `/skills` — list and dispatch the agent skills in `.agents/skills/`.
 *
 * A skill is a directory holding a `SKILL.md` whose YAML frontmatter carries a
 * `name` and a `description`. That is the whole contract: the tool reads the
 * filesystem, never a bundled registry, so a new skill is picked up by dropping
 * a folder in and needs no change here.
 *
 * The pure parts (frontmatter parsing, command parsing, listing, dispatch text)
 * live in `src/lib/skills.ts` so they can be tested; this file is the shell.
 *
 *   /skills                list every skill
 *   /skills <name>         print the skill's full instructions ("cook" it)
 *   /skills <name> --json  machine-readable form, for editor integrations
 */
import {
  buildDispatch,
  listSkills,
  parseCommand,
  renderList,
  SKILLS_DIR,
} from "../src/lib/skills.ts";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

/** Read one skill's body, or null when the directory vanished mid-run. */
const readSkill = (name: string): string | null => {
  try {
    return readFileSync(path.join(SKILLS_DIR, name, "SKILL.md"), "utf8");
  } catch {
    return null;
  }
};
const main = (argv: string[]): number => {
  const command = parseCommand(argv);
  const skills = listSkills();

  if (command.kind === "help") {
    process.stdout.write(
      [
        "/skills                list every skill",
        "/skills <name>         print that skill's instructions",
        "/skills <name> --json  print it as JSON",
        "",
      ].join("\n"),
    );
    return 0;
  }

  if (command.kind === "list") {
    if (command.json) {
      process.stdout.write(`${JSON.stringify(skills, null, 2)}\n`);
      return 0;
    }
    process.stdout.write(renderList(skills));
    return skills.length > 0 ? 0 : 1;
  }

  // Dispatch: hand the agent the skill body to follow. The leading line is the
  // invocation itself, so a transcript reads as a real `/skills <name>` call.
  // Resolve through the registry so the header can state the real description
  // and a typo'd name reports as unknown rather than an empty skill.
  const skill = skills.find((s) => s.name === command.skill.name) ?? null;
  if (skill === null) {
    const known = skills.map((s) => `  /${s.name}`).join("\n");
    process.stderr.write(
      `skills: unknown skill "${command.skill.name}"\n\nKnown skills:\n${known}\n`,
    );
    return 1;
  }
  const body = readSkill(skill.name);
  if (body === null) {
    process.stderr.write(`skills: cannot read "${skill.name}"\n`);
    return 1;
  }
  if (command.json) {
    process.stdout.write(`${JSON.stringify({ ...skill, body }, null, 2)}\n`);
    return 0;
  }
  process.stdout.write(buildDispatch(skill, body));
  return 0;
};

process.exit(main(process.argv.slice(2)));
