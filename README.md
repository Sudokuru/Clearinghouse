# Clearinghouse

# Prerequisites

* Docker
* Bash
* npm
* bun

# Setup

1. Run `npm i`

# Usage

```bash
# Start Postgres DB, create Puzzles table to store puzzle data, and run ingest pipeline to load puzzle data
# GENERATE_TIME_LIMIT is the number of seconds the puzzle generation jobs can run before they wind down, defaults to 60
# GENERATE_THREADS is the number of threads used during puzzle generation (in addition to main thread), defaults to 1
GENERATE_TIME_LIMIT=60 GENERATE_THREADS=1 bash start.sh

# Exec into the DB to run SQL commands (run exit when done)
docker exec -it sudoku-postgres psql -U postgres

# Stop Postgres DB to store puzzle data
bash stop.sh

# Delete Postgres DB to store puzzle data
bash delete.sh
```

# Ingest Pipeline (run by start.sh)

1. TODO: Insert puzzle data from puzzles.csv into the Postgres DB

2. TODO: Generate puzzle data using Sudokuru library for any puzzles in puzzles.txt that are not already in the Postgres DB

3. TODO: Insert newly generated puzzle data into the Postgres DB
