echo "Querying the database to find the requested puzzles..."

sql_query="SELECT string_agg(CONCAT(puzzle, ', ',  solution, ', ', difficulty), ', ') FROM Puzzles WHERE difficulty >= %s AND difficulty <= %s LIMIT %s;"
sql_query=$(printf "$sql_query" "$MIN_DIFFICULTY" "$MAX_DIFFICULTY" "$PUZZLE_COUNT")
echo $sql_query | docker exec -i sudoku-postgres psql -U postgres -d postgres > temp1.csv
sed '1,2d' temp1.csv | sed '$d' | sed '$d' > temp2.csv
rm temp1.csv
bun export.ts
rm temp2.csv
