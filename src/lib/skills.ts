import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/** Absolute path to the skills directory, resolved from this module. */
export const SKILLS_DIR = path.resolve(
  import.meta.dirname,
  "../../.agents/skills",
);

/** One skill, as read from its `SKILL.md` frontmatter. */
export interface Skill {
  name: string;
  description: string;
}

/**
 * Parse the YAML frontmatter of a `SKILL.md`.
 *
 * Deliberately a minimal reader rather than a YAML dependency: the block is a
 * flat `key: value` list, and a full parser would be a new package for two
 * fields. Quoted values are unwrapped because descriptions routinely contain
 * colons and apostrophes. Returns `null` when the file has no frontmatter,
 * which is how a non-skill file is rejected.
 */
export const parseFrontmatter = (
  raw: string,
): Record<string, string> | null => {
  if (!raw.startsWith("---")) return null;
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return null;

  const fields: Record<string, string> = {};
  for (const line of raw.slice(3, end).split("\n")) {
    const match = /^\s*([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    const [, key, rest] = match;
    const value = rest.trim();
    fields[key] =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
        ? value.slice(1, -1)
        : value;
  }
  return fields;
};

/** Read a skill from its `SKILL.md`, or `null` if it is not a valid skill. */
export const readSkillFile = (raw: string): Skill | null => {
  const fields = parseFrontmatter(raw);
  const name = fields?.name?.trim();
  if (!fields || !name) return null;
  return { name, description: fields.description?.trim() ?? "" };
};

/** Every skill in `.agents/skills`, sorted by name. */
export const listSkills = (dir: string = SKILLS_DIR): Skill[] => {
  if (!existsSync(dir)) return [];
  const skills: Skill[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    let raw: string;
    try {
      raw = readFileSync(path.join(dir, entry.name, "SKILL.md"), "utf8");
    } catch {
      continue; // a directory without a SKILL.md is not a skill
    }
    const skill = readSkillFile(raw);
    if (skill) skills.push(skill);
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
};

/** The resolved result of a `/skills …` invocation. */
export type Command =
  | { kind: "help" }
  | { kind: "list"; json: boolean }
  | { kind: "dispatch"; skill: Skill; json: boolean };

/**
 * Parse argv into a command.
 *
 * A leading `/skills` is stripped so the same function serves the `bin/skills`
 * wrapper, `npm run skills -- …`, and a pasted `/skills tdd` line.
 */
export const parseCommand = (argv: string[]): Command => {
  const args = argv.filter((a) => a !== "/skills" && a !== "skills");
  if (args.includes("--help") || args.includes("help")) {
    return { kind: "help" };
  }
  const json = args.includes("--json");
  const name = args.find((a) => !a.startsWith("--"));
  if (!name) return { kind: "list", json };
  return { kind: "dispatch", skill: { name, description: "" }, json };
};

/** Human-readable listing, one line per skill, with the leading `/`. */
export const renderList = (skills: Skill[]): string => {
  if (!skills.length) return "No skills found in .agents/skills\n";
  const width = Math.max(...skills.map((s) => s.name.length));
  return `${skills
    .map((s) => `  /${s.name.padEnd(width)}  ${s.description}`)
    .join("\n")}\n`;
};

/**
 * The text handed to the agent when a skill is invoked.
 *
 * The frontmatter is stripped: the header line above already states the name
 * and description, so repeating the raw `---` block would just be noise the
 * model has to read past.
 */
export const buildDispatch = (skill: Skill, body: string): string => {
  const content = stripFrontmatter(body).trim();
  return [
    `/${skill.name}${skill.description ? ` — ${skill.description}` : ""}`,
    "",
    content,
    "",
  ].join("\n");
};

/** Drop a leading `---` frontmatter block, leaving the markdown body. */
export const stripFrontmatter = (raw: string): string => {
  if (!raw.startsWith("---")) return raw;
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return raw;
  const after = raw.indexOf("\n", end + 1);
  return after === -1 ? "" : raw.slice(after + 1);
};
