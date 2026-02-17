import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { log, logProgressTwoLines, COLORS } from "./logs";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

let writes: string[] = [];
const origWrite = process.stdout.write;
const origLog = console.log;
const origColumns = process.stdout.columns;

beforeEach(() => {
  writes = [];
  process.stdout.write = (chunk: any) => {
    writes.push(String(chunk));
    return true;
  };
  console.log = (...args: any[]) => {
    writes.push(args.join(" "));
  };
  // narrow terminal to exercise truncation logic if present
  process.stdout.columns = 40;
});

afterEach(() => {
  process.stdout.write = origWrite;
  console.log = origLog;
  process.stdout.columns = origColumns;
});

describe("log", () => {
    it("writes a colored line with newline when not progress", () => {
    log("hello", COLORS.CYAN);
    const out = writes.join("");
    expect(out).toMatch(/\[CH] hello/);
    });

  it("overwrites same line when progress=true", () => {
    log("first", COLORS.CYAN, undefined, true);
    log("second", COLORS.CYAN, undefined, true);
    const out = writes.join("");
    expect(out).toContain("\r");     // carriage return
    expect(out).toContain("\x1b[K"); // clear line
    expect(out).toContain("second");
    // no trailing newline
    expect(out.endsWith("\n")).toBeFalse();
  });

  it("appends to file and swallows file errors", () => {
    const tmp = mkdtempSync(join(tmpdir(), "ch-log-"));
    const file = join(tmp, "out.log");
    log("file-msg", undefined, file);
    const content = readFileSync(file, "utf8");
    expect(content).toContain("file-msg");
    rmSync(tmp, { recursive: true, force: true });
  });
});

describe("logProgressTwoLines", () => {
  it("writes two lines and moves cursor back up", () => {
    logProgressTwoLines("line1", "line2", COLORS.CYAN);
    const out = writes.join("");
    // first line cleared and written (colored)
    expect(out).toContain("\r\x1b[K");
    expect(out).toContain("line1");
    // second line cleared and written, then cursor up one line
    expect(out).toContain("\n\x1b[K");
    expect(out).toContain("line2");
    expect(out).toContain("\x1b[F");
  });
});