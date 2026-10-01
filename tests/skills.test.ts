import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildDispatch,
  listSkills,
  parseCommand,
  parseFrontmatter,
  readSkillFile,
  renderList,
  stripFrontmatter,
} from "@/lib/skills";

/** A throwaway skills tree so tests never depend on the repo's real skills. */
const skillsDir = (skills: Record<string, string | null>): string => {
  const root = mkdtempSync(path.join(tmpdir(), "skills-"));
  for (const [name, body] of Object.entries(skills)) {
    mkdirSync(path.join(root, name), { recursive: true });
    if (body !== null) {
      writeFileSync(path.join(root, name, "SKILL.md"), body, "utf8");
    }
  }
  return root;
};

const tdd = `---
name: tdd
description: "Red-green: build it test first."
---

# TDD

Write the failing test first.
`;

describe("parseFrontmatter", () => {
  it("reads flat key/value pairs", () => {
    expect(
      parseFrontmatter("---\nname: tdd\ndescription: hello\n---\nbody"),
    ).toEqual({
      name: "tdd",
      description: "hello",
    });
  });

  it("unwraps quoted values so colons and apostrophes survive", () => {
    const fields = parseFrontmatter(
      '---\ndescription: "ADR\'s and glossary: as we go"\n---\n',
    );
    expect(fields?.description).toBe("ADR's and glossary: as we go");
  });

  it("returns null without frontmatter, so non-skills are rejected", () => {
    expect(parseFrontmatter("# Just a heading\n")).toBeNull();
  });
});

describe("readSkillFile", () => {
  it("keeps a skill that names itself", () => {
    expect(readSkillFile(tdd)).toEqual({
      name: "tdd",
      description: "Red-green: build it test first.",
    });
  });

  it("rejects a file with no name", () => {
    expect(readSkillFile("---\ndescription: nameless\n---\n")).toBeNull();
  });

  it("defaults a missing description to empty", () => {
    expect(readSkillFile("---\nname: bare\n---\n")).toEqual({
      name: "bare",
      description: "",
    });
  });
});

describe("listSkills", () => {
  it("lists only real skills, sorted by name", () => {
    const dir = skillsDir({
      tdd: tdd,
      implement: "---\nname: implement\ndescription: Ship it.\n---\n",
      broken: "---\ndescription: no name here\n---\n",
      "just-a-folder": null,
    });
    expect(listSkills(dir).map((s) => s.name)).toEqual(["implement", "tdd"]);
  });

  it("returns empty when the directory is missing", () => {
    expect(listSkills(path.join(tmpdir(), "skills-does-not-exist"))).toEqual(
      [],
    );
  });

  it("finds the repo's real skills", () => {
    const names = listSkills().map((s) => s.name);
    expect(names).toContain("tdd");
    expect(names).toContain("implement");
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);
  });
});

describe("parseCommand", () => {
  it("defaults to a listing", () => {
    expect(parseCommand([])).toEqual({ kind: "list", json: false });
  });

  it("accepts the command with or without its slash, as pasted or wrapped", () => {
    expect(parseCommand(["/skills"])).toEqual({ kind: "list", json: false });
    expect(parseCommand(["/skills", "tdd"])).toMatchObject({
      kind: "dispatch",
      skill: { name: "tdd" },
    });
    expect(parseCommand(["skills", "tdd"])).toMatchObject({
      kind: "dispatch",
      skill: { name: "tdd" },
    });
  });

  it("reads --json as a flag, not a skill name", () => {
    expect(parseCommand(["--json"])).toEqual({ kind: "list", json: true });
    expect(parseCommand(["tdd", "--json"])).toMatchObject({
      kind: "dispatch",
      skill: { name: "tdd" },
      json: true,
    });
  });

  it("recognises help in either spelling", () => {
    expect(parseCommand(["help"]).kind).toBe("help");
    expect(parseCommand(["--help"]).kind).toBe("help");
  });
});

describe("renderList", () => {
  it("says so plainly when there are no skills", () => {
    expect(renderList([])).toContain("No skills found");
  });

  it("gives every line a / prefix and an aligned description", () => {
    const out = renderList([
      { name: "tdd", description: "Test first." },
      { name: "improve-codebase-architecture", description: "Deepen it." },
    ]);
    const lines = out.trimEnd().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("  /tdd                            Test first.");
    expect(lines[1]).toBe("  /improve-codebase-architecture  Deepen it.");
  });
});

describe("stripFrontmatter", () => {
  it("drops the block but keeps the body", () => {
    expect(stripFrontmatter(tdd).trim()).toBe(
      "# TDD\n\nWrite the failing test first.",
    );
  });

  it("leaves a file without frontmatter untouched", () => {
    expect(stripFrontmatter("# Title\n")).toBe("# Title\n");
  });
});

describe("buildDispatch", () => {
  it("leads with the invocation and a real description", () => {
    const out = buildDispatch(
      { name: "tdd", description: "Red-green: build it test first." },
      tdd,
    );
    expect(out.split("\n")[0]).toBe("/tdd — Red-green: build it test first.");
  });

  it("omits the separator when there is no description", () => {
    expect(
      buildDispatch({ name: "bare", description: "" }, "# X").split("\n")[0],
    ).toBe("/bare");
  });

  it("does not re-print the frontmatter the header already states", () => {
    const out = buildDispatch({ name: "tdd", description: "d" }, tdd);
    expect(out).not.toContain("---");
    expect(out).toContain("Write the failing test first.");
  });
});
