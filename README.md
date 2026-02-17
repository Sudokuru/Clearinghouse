# Clearinghouse

# Prerequisites

* Docker
* Bash
* bun

# Setup

1. Run `bun install`

# Usage

GENERATE_TIME_LIMIT is the number of seconds the puzzle generation jobs can run before they wind down, defaults to 60

GENERATE_THREADS is the number of threads used during puzzle generation (in addition to compute used by Redis docker), defaults to 1

Use the following commands to determine the number of logical CPU cores on your system:
| **Platform** | **Command**                          |
|--------------|--------------------------------------|
| Linux        | `nproc`                              |
| macOS        | `sysctl -n hw.logicalcpu`            |
| Windows      | `wmic cpu get NumberOfLogicalProcessors` |

Based on the number of CPU cores, use the following guidelines to set the number of threads:

| **CPU Cores** | **Recommended Threads** |
|---------------|--------------------------|
| 1-2 cores     | 1 thread                |
| 4 cores       | 2-4 threads             |
| 8 cores       | 4-6 threads             |
| 16+ cores     | 8-12 threads            |

REDIS_STREAM_BATCH_SIZE is the batch size to use for redis to load in the unsolved puzzle csv file (PUZZLE_FILE), defaults to 500

PUZZLE_FILE is the optional file with one sudoku puzzle string per line to solve

SOLVED_PUZZLE_FILE is the file containing presolved sudoku puzzles, defaults to puzzles.csv

MAX_DRILLS_PER_STRATEGY is the maximum number of occurrences of a given strategy will be captured and added to csv, defaults to 5000

SOLVED_DRILL_FILE is the csv file used to read existing solved drills from and add new ones to, defaults to drills.csv

```bash
# Start Redis docker, load puzzle data from provided solved puzzle file and optional unsolved puzzle file to generate data for
GENERATE_TIME_LIMIT=60 GENERATE_THREADS=1 REDIS_STREAM_BATCH_SIZE=500 UNSOLVED_PUZZLE_FILE=puzzles1.txt SOLVED_PUZZLE_FILE=puzzles.csv bun start.ts

# Reads drills found in solved puzzles, generates data for them, and appends them to a csv
MAX_DRILLS_PER_STRATEGY=5000 SOLVED_PUZZLE_FILE=puzzles.csv SOLVED_DRILL_FILE=drills.csv bun ingest_drills.ts

# Exec into the Redis container to run Redis commands (run exit when done)
docker exec -it sudoku-redis redis-cli

## Scan over solved puzzles
SCAN 0 MATCH "solved:*" COUNT 1000

## Get solved puzzle field values using key
HGETALL solved:007500023850004060030102590700200010000710835080040076300620751915837042276000000

# Stop Redis docker
bun stop.ts

# Delete data stored in Redis docker
bun clear.ts

# Print number of available drills per strategy and the minimum across strategies
SOLVED_PUZZLE_FILE=puzzles.csv bun print_available_drills.ts

# Run tests
bun run test

# Export solved drills to TypeScript files for each strategy
SOLVED_DRILL_FILE=drills.csv bun export_drills.ts

# Run tests
bun run_tests.ts

# Example helper script to run ingest_puzzles.ts on multiple new unsolved puzzle files at once
bash runall.sh
```

# Puzzles

Puzzles are generated using the Sudokuru [sudoku.js fork](https://github.com/Sudokuru/sudoku.js).

# Provided Puzzle Files

- puzzles1.txt: Contains 40k mostly easy puzzles
  Source: generated 2k each of puzzles with 42-61 inclusive givens by running generate.ts in this sudoku generator fork: https://github.com/Sudokuru/sudoku.js
- puzzles2.txt: Contains 80k puzzles including a lot of moderate and hard ones
  Source: subset of this: https://www.kaggle.com/datasets/radcliffe/3-million-sudoku-puzzles-with-ratings?resource=download
- puzzles3.txt: Contains 20k puzzles mostly somewhere between easy and moderate difficulty
  Source: subset of this: https://www.kaggle.com/datasets/rohanrao/sudoku


## Progress reporting

During solving, two lines are updated periodically (default every 5 seconds):

```
[CH] Progress: {processed}/{totalToSolve} ({percent}%) | ETA {HH:MM:SS} | Threads: {threads}
[CH] Stats - New: {new} | Already: {already} | Failed: {failed} | Remaining: {remaining}/{puzzleCount}
```

Fields:

- **processed / totalToSolve / percent**: From stream consumption (`pending + lag` via `XINFO GROUPS`). `processed = totalToSolve - (pending + lag)`.
- **ETA (HH:MM:SS)**: `elapsedSecs = now - startTime`; `rate = processed / elapsedSecs`; `etaSecs = remaining / rate`; formatted as HH:MM:SS.
- **Threads**: Worker process count.
- **New**: Newly solved this run (`new:solved:puzzles` set).
- **Already**: Already in Redis (`already:solved:puzzles` set).
- **Failed**: Errored in Redis (`failed:solve:puzzles` set).
- **Remaining**: `puzzleCount - (new + already + failed)`.
- **puzzleCount**: Total puzzles loaded from the unsolved file.


Final summary:

```
[CH] Final: New: {new} | Already: {already} | Failed: {failed} | Timed Out: {timedOut} | Total: {puzzleCount}
```

Notes:

- Tracking sets (`new:solved:puzzles`, `already:solved:puzzles`, `failed:solve:puzzles`) are cleared at run start; metrics are per-run.
- Unsolved stream is deleted/recreated each run; `totalToSolve`/ETA reflect the current run only.
- DB size grows only for **New** puzzles written to Redis; **Already** and **Failed** do not increase `DBSIZE`.

# Temporarily Deprecated Features Usable Only in git tag 1.0.0
To access these deprecated features, run `git checkout 1.0.0` to switch to the legacy version.

## Exporting puzzles to ts format expected by Sudokuru Frontend
Kept current exports.ts generated file and Puzzle.type.ts
Will be very easy to write new ts script that reads solved puzzles csv and prints new exports.ts

## Generation of Difficulty Report for Solved Puzzles
Kept current DifficultyReport.txt and explanatory DifficultyRanges.md
Will be very easy to write new ts script that reads solved puzzles csv and collects difficulties then outputs report

# Future
- [ ] consider using testcontainers to simplify testing setup and to isolate test redis from script redis. Bun / testcontainers compatibility is currently broken here: https://github.com/oven-sh/bun/discussions/21953
- [ ] install prettier or alternative so we don't battle between windows and linux line endings.
