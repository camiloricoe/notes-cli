import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { run } from "../src/cli.ts";
import { addNote, deleteNote, filterByTag, formatList, NotesError, type Note } from "../src/notes.ts";

const DAY = "2026-11-06";
const tmpFile = () => join(mkdtempSync(join(tmpdir(), "notes-")), "notes.json");

describe("notes", () => {
  it("adds a note with the next id", () => {
    const notes = addNote(addNote([], "first", DAY), "second", DAY);
    expect(notes.map((n) => n.id)).toEqual([1, 2]);
  });

  it("trims text and refuses empty notes", () => {
    expect(addNote([], "  hi  ", DAY)[0].text).toBe("hi");
    expect(() => addNote([], "   ", DAY)).toThrow(NotesError);
  });

  it("deletes by id and refuses unknown ids", () => {
    const notes: Note[] = addNote([], "a", DAY);
    expect(deleteNote(notes, 1)).toEqual([]);
    expect(() => deleteNote(notes, 9)).toThrow("no note with id 9");
  });

  it("formats a list", () => {
    expect(formatList([])).toBe("No notes yet.");
    expect(formatList(addNote([], "milk", DAY))).toBe("1. milk (2026-11-06)");
  });
});

describe("tags", () => {
  it("stores tags trimmed, lowercased and unique", () => {
    const [n] = addNote([], "x", DAY, [" Work ", "work", "Urgent"]);
    expect(n.tags).toEqual(["work", "urgent"]);
  });

  it("adds no tags field without tags", () => {
    expect(addNote([], "x", DAY)[0]).toEqual({ id: 1, text: "x", created: DAY });
  });

  it("refuses blank tags", () => {
    expect(() => addNote([], "x", DAY, ["  "])).toThrow(NotesError);
    expect(() => addNote([], "x", DAY, [""])).toThrow("a tag cannot be empty");
  });

  it("filters by tag, ignoring case and legacy notes", () => {
    const notes = addNote(addNote([], "a", DAY, ["Work"]), "b", DAY);
    expect(filterByTag(notes, "WORK").map((n) => n.id)).toEqual([1]);
  });

  it("formats tags after the date", () => {
    expect(formatList(addNote([], "milk", DAY, ["home", "shop"]))).toBe("1. milk (2026-11-06) [home, shop]");
    expect(formatList(addNote([], "milk", DAY))).toBe("1. milk (2026-11-06)");
  });
});

describe("cli tags", () => {
  it("adds with repeated tags and lists them", () => {
    const file = tmpFile();
    expect(run(["add", "--tag", "work", "--tag", "urgent", "call", "Ana"], file, DAY)).toEqual({ code: 0, out: "Added note 1." });
    expect(run(["list"], file, DAY).out).toBe("1. call Ana (2026-11-06) [work, urgent]");
  });

  it("lists only notes with the tag", () => {
    const file = tmpFile();
    run(["add", "--tag", "work", "a"], file, DAY);
    run(["add", "b"], file, DAY);
    expect(run(["list", "--tag", "work"], file, DAY).out).toBe("1. a (2026-11-06) [work]");
  });

  it("reports when no note has the tag", () => {
    expect(run(["list", "--tag", "nope"], tmpFile(), DAY)).toEqual({ code: 0, out: 'No notes with tag "nope".' });
  });

  it("handles missing values", () => {
    const res = run(["list", "--tag"], tmpFile(), DAY);
    expect(res.code).toBe(2);
    expect(res.out).toContain("usage:");
    expect(run(["add", "--tag", "work"], tmpFile(), DAY)).toEqual({ code: 1, out: "error: a note needs some text" });
  });
});

describe("cli", () => {
  it("adds and lists notes in the file", () => {
    const file = tmpFile();
    expect(run(["add", "buy", "milk"], file, DAY)).toEqual({ code: 0, out: "Added note 1." });
    expect(run(["list"], file, DAY).out).toBe("1. buy milk (2026-11-06)");
  });

  it("deletes a note", () => {
    const file = tmpFile();
    run(["add", "x"], file, DAY);
    expect(run(["delete", "1"], file, DAY).code).toBe(0);
    expect(run(["list"], file, DAY).out).toBe("No notes yet.");
  });

  it("reports errors with exit code 1", () => {
    const file = tmpFile();
    writeFileSync(file, "{ not json");
    expect(run(["list"], file, DAY).code).toBe(1);
    expect(run(["delete", "3"], tmpFile(), DAY)).toEqual({ code: 1, out: "error: no note with id 3" });
  });

  it("prints usage for unknown commands", () => {
    expect(run(["fly"], tmpFile(), DAY).code).toBe(2);
  });
});
