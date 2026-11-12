// notes add [--tag <t>]... <text> | notes list [--tag <t>] | notes delete <id>. Run with: node src/cli.ts <command>
import { addNote, deleteNote, filterByTag, formatList, loadNotes, NotesError, saveNotes, type Note } from "./notes.ts";

export interface Result {
  code: number;
  out: string;
}

const USAGE = "usage: notes add [--tag <t>]... <text> | notes list [--tag <t>] | notes delete <id>";

// Pulls leading `--tag <t>` pairs off the args; null when a --tag has no value.
function takeTags(args: string[]): { tags: string[]; rest: string[] } | null {
  const tags: string[] = [];
  let i = 0;
  while (args[i] === "--tag") {
    if (i + 1 >= args.length) return null;
    tags.push(args[i + 1]);
    i += 2;
  }
  return { tags, rest: args.slice(i) };
}

function listNotes(notes: Note[], args: string[]): Result {
  const parsed = takeTags(args);
  if (!parsed) return { code: 2, out: USAGE };
  const tag = parsed.tags[0];
  if (tag === undefined) return { code: 0, out: formatList(notes) };
  const found = filterByTag(notes, tag);
  return { code: 0, out: found.length ? formatList(found) : `No notes with tag "${tag}".` };
}

export function run(argv: string[], file: string, today: string): Result {
  const [command, ...rest] = argv;
  try {
    const notes = loadNotes(file);
    if (command === "add") {
      const parsed = takeTags(rest);
      if (!parsed) return { code: 2, out: USAGE };
      const next = addNote(notes, parsed.rest.join(" "), today, parsed.tags);
      saveNotes(file, next);
      return { code: 0, out: `Added note ${next[next.length - 1].id}.` };
    }
    if (command === "list") return listNotes(notes, rest);
    if (command === "delete") {
      saveNotes(file, deleteNote(notes, Number(rest[0])));
      return { code: 0, out: `Deleted note ${rest[0]}.` };
    }
    return { code: 2, out: USAGE };
  } catch (err) {
    if (err instanceof NotesError || err instanceof SyntaxError) return { code: 1, out: `error: ${err.message}` };
    throw err;
  }
}

if (import.meta.main) {
  const result = run(process.argv.slice(2), process.env.NOTES_FILE ?? "notes.json", new Date().toISOString().slice(0, 10));
  console.log(result.out);
  process.exitCode = result.code;
}
