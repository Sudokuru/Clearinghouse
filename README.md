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

2. IN PROGRESS: Generate puzzle data using Sudokuru library for any puzzles in puzzles.txt that are not already in the Postgres DB and insert them
	* DONE: Write script to generate SQL insert statement for a given puzzle
	* DONE: Update start.sh to read each individual puzzle from puzzles.txt
	* TODO: Update start.sh to identify which puzzles are not in the database already
	* TODO: Update start.sh to put new puzzles in generate.txt temp file
	* TODO: Update start.sh to call GenerateInsert for each new puzzle
	* TODO: Update start.sh to pipe GenerateInsert output to database
	* TODO: Update start.sh to run GenerateInsert on GENERATE_THREADS number of threads
	* TODO: Update threads to monitor time elapsed and stop if it exceends GENERATE_TIME_LIMIT
	* TODO: Update main thread to query database every few seconds and output progress as percentage and max time remaining 
	* TODO: Add finished and added x new puzzles in x seconds to database (or no new puzzles) end message
	* TODO: Delete generate.txt

3. TODO: Export Puzzles table data to puzzles.csv if new puzzles were inserted
