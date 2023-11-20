# Clearinghouse

# Usage

```bash
# Start Postgres DB and create Puzzles table to store puzzle data
bash start.sh

# Exec into the DB to run SQL commands (run exit when done)
docker exec -it sudoku-postgres psql -U postgres

# Stop Postgres DB to store puzzle data
bash stop.sh

# Delete Postgres DB to store puzzle data
bash delete.sh
```
