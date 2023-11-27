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

1. Insert puzzle data from puzzles.sql into the Postgres DB

2. For each puzzles in puzzles.txt (or until reach GENERATE_TIME_LIMIT):
	* Checks if the puzzle is already in the database
	* If the puzzle is not already in the database then does the following:
		* Checks if each of the GENERATE_THREADS has been assigned already to generate data for a puzzle
		* If threads are all assigned then waits until the youngest thread finishes
		* Once a thread is available it assigns it to generate puzzle data and put the insert statement in inserts.sql

3. Once all the insert statements for the new puzzles have been created they are appended to puzzles.sql

4. All the new insert statements in inserts.sql are executed and inserts.sql is deleted

* TODO: Add finished and added x new puzzles in x seconds to database (or no new puzzles) end message
