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

MIN_DIFFICULTY and MAX_DIFFICULTY optionally filter puzzles exported by difficulty in export_puzzles.ts, defaulting to no lower/upper bound.

MAX_EXPORT_PUZZLES optionally limits how many puzzles export_puzzles.ts writes, defaulting to no limit.

OUTPUT_DIR is used by export_drills.ts and export_puzzles_by_difficulty.ts. These scripts exit early if the directory already exists.

```bash
# Start Redis docker, load puzzle data from provided solved puzzle file and optional unsolved puzzle file to generate data for
GENERATE_TIME_LIMIT=60 GENERATE_THREADS=1 REDIS_STREAM_BATCH_SIZE=500 UNSOLVED_PUZZLE_FILE=puzzles1.txt SOLVED_PUZZLE_FILE=puzzles.csv bun ingest_puzzles.ts

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
SOLVED_DRILL_FILE=drills.csv OUTPUT_DIR=exported_drills bun export_drills.ts

# Export solved puzzles to a TypeScript file as InputPuzzle[]
SOLVED_PUZZLE_FILE=puzzles.csv MIN_DIFFICULTY=-20000 MAX_DIFFICULTY=-10000 MAX_EXPORT_PUZZLES=1000 PUZZLES_ARRAY_NAME=puzzles bun export_puzzles.ts

# Export one TypeScript file per difficulty range from DifficultyRanges.ts
SOLVED_PUZZLE_FILE=puzzles.csv MAX_EXPORT_PUZZLES=500 OUTPUT_DIR=exported_puzzles_by_difficulty bun export_puzzles_by_difficulty.ts

# Print available solved puzzle counts per difficulty range from DifficultyRanges.ts
SOLVED_PUZZLE_FILE=puzzles.csv bun print_available_puzzles_by_difficulty.ts

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

# Future
- [ ] consider using testcontainers to simplify testing setup and to isolate test redis from script redis. Bun / testcontainers compatibility is currently broken here: https://github.com/oven-sh/bun/discussions/21953
- [ ] install prettier or alternative so we don't battle between windows and linux line endings.
