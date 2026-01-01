# Clearinghouse

# Prerequisites

* Docker
* Bash
* bun

# Setup

1. Run `bun install`

# Usage


Start Redis docker, load puzzle data from provided solved puzzle file and optional unsolved puzzle file to generate data for

GENERATE_TIME_LIMIT is the number of seconds the puzzle generation jobs can run before they wind down, defaults to 60

GENERATE_THREADS is the number of threads used during puzzle generation (in addition to compute used by Redis docker), defaults to 1
Use `nproc` command on bash or `wmic cpu get NumberOfLogicalProcessors` on windows to get number of CPU cores. Then use this guideline for setting number of threads.
- 1-2 cores → Use 1 thread
- 4 cores → Use 2-4 threads
- 8 cores → Use 4-6 threads
- 16+ cores → Use 8-12 threads

REDIS_STREAM_BATCH_SIZE is the batch size to use for redis to load in the unsolved puzzle csv file (PUZZLE_FILE), defaults to 500

PUZZLE_FILE is the optional file with one sudoku puzzle string per line to solve

SOLVED_PUZZLE_FILE is the file containing presolved sudoku puzzles, defaults to puzzles.csv

```bash
GENERATE_TIME_LIMIT=60 GENERATE_THREADS=1 REDIS_STREAM_BATCH_SIZE=500 UNSOLVED_PUZZLE_FILE=puzzles1.txt SOLVED_PUZZLE_FILE=puzzles.csv bun start.ts

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

# Run tests
bun tests.ts

# Example helper script to run start.ts on multiple new unsolved puzzle files at once
bash runall.sh
```

## Temporarily Deprecated Features Usable Only in git tag 1.0.0
To access these deprecated features, run `git checkout 1.0.0` to switch to the legacy version.

## Exporting puzzles to ts format expected by Sudokuru Frontend
Kept current exports.ts generated file and Puzzle.type.ts
Will be very easy to write new ts script that reads solved puzzles csv and prints new exports.ts

## Generation of Difficulty Report for Solved Puzzles
Kept current DifficultyReport.txt and explanatory DifficultyRanges.md
Will be very easy to write new ts script that reads solved puzzles csv and collects difficulties then outputs report

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

When solving puzzles, a progress line is printed periodically:

```
[Clearinghouse] Progress: {processed}/{total} ({percent}%)
```

How it is computed:

- `total` (`totalToSolve`): the number of unsolved stream entries right after loading (via `XLEN unsolved`), after the stream is cleared and the consumer group is recreated each run.
- `remaining`: `pending + lag` from `XINFO GROUPS unsolved` (pending = delivered but not ACKed; lag = not yet delivered).
- `processed`: `totalToSolve - (pending + lag)`, clamped to zero.
- `percent`: `processed / totalToSolve * 100`.

ETA:

- We track `startTime` at the beginning of solving.
- `elapsedSecs = (now - startTime)`.
- `rate = processed / elapsedSecs` (puzzles per second).
- `etaSecs = remaining / rate` (if rate > 0; otherwise “estimating...”).
- `ETA` is shown as `HH:MM:SS` from `etaSecs`.
- Final line prints `ETA 00:00:00`.

Notes:

- This progress reflects stream consumption, not Redis DB growth. DB size increases only when a puzzle is newly solved and written; puzzles that were already solved or that fail will not grow the DB.
- The unsolved stream is deleted and the consumer group is recreated at the start of each run, so progress is per-run, not cumulative across runs.