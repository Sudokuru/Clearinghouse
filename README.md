# Clearinghouse

# Prerequisites

* Docker
* Bash
* npm
* bun

# Setup

1. Run `bun install`

# Usage

```bash
# Start Redis docker, load puzzle data from provided solved puzzle file and optional unsolved puzzle file to generate data for
# GENERATE_TIME_LIMIT is the number of seconds the puzzle generation jobs can run before they wind down, defaults to 60
# GENERATE_THREADS is the number of threads used during puzzle generation (in addition to compute used by Redis docker), defaults to 1
# PUZZLE_FILE is the optional file with one sudoku puzzle string per line to solve
# SOLVED_PUZZLE_FILE is the file containing presolved sudoku puzzles, defaults to puzzles.csv
GENERATE_TIME_LIMIT=60 GENERATE_THREADS=1 PUZZLE_FILE=puzzles1.txt SOLVED_PUZZLE_FILE=puzzles.csv bun start.ts

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

# Example helper script to run start.ts on multiple new unsolved puzzle files at once
bash runall.sh

# Temporarily Deprecated Features Usable Only in git tag 1.0.0

## Exporting puzzles to ts format expected by Sudokuru Frontend
### Kept current exports.ts generated file and Puzzle.type.ts
### Will be very easy to write new ts script that reads solved puzzles csv and prints new exports.ts

## Generation of Difficulty Report for Solved Puzzles
### Kept current DifficultyReport.txt and explanatory DifficultyRanges.md
### Will be very easy to write new ts script that reads solved puzzles csv and collects difficulties then outputs report

# Puzzles

Puzzles are generated using the Sudokuru [sudoku.js fork](https://github.com/Sudokuru/sudoku.js).

# Provided Puzzle Files

- puzzles1.txt: Contains 40k mostly easy puzzles
  Source: generated 2k each of puzzles with 42-61 inclusive givens by running generate.ts in this sudoku generator fork: https://github.com/Sudokuru/sudoku.js
- puzzles2.txt: Contains 80k puzzles including a lot of moderate and hard ones
  Source: subset of this: https://www.kaggle.com/datasets/radcliffe/3-million-sudoku-puzzles-with-ratings?resource=download
- puzzles3.txt: Contains 20k puzzles mostly somewhere between easy and moderate difficulty
  Source: subset of this: https://www.kaggle.com/datasets/rohanrao/sudoku