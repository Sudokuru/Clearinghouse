echo "Querying the database to find the requested puzzles..."

sql_query="SELECT string_agg(CONCAT(puzzle, ', ',  solution, ', ', difficulty), ', ') FROM Puzzles WHERE difficulty >= %s AND difficulty <= %s LIMIT %s;"
sql_query=$(printf "$sql_query" "$MIN_DIFFICULTY" "$MAX_DIFFICULTY" "$PUZZLE_COUNT")
echo $sql_query | docker exec -i sudoku-postgres psql -U postgres -d postgres > temp.txt
