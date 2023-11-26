echo "The Postgres Docker is starting..."

SECONDS=0

if docker run --name sudoku-postgres -e POSTGRES_PASSWORD=sudokuru -d postgres ; then
	echo -e "\033[32mPostgres Docker started successfully in $SECONDS seconds.\033[m"
	echo "Postgres Docker started successfully in $SECONDS seconds."
else
	echo "sudoku-postgres already exists, attempting restart..."
	if docker start sudoku-postgres ; then
		echo -e "\033[32mPostgres Docker restarted successfully in $SECONDS seconds.\033[m"
	else
		echo -e "\033[31mPostgres Docker failed to start.\033[m"
		exit 1
	fi
fi

if cat ./create-puzzles-table.sql | docker exec -i sudoku-postgres psql -U postgres -d postgres ; then
	echo -e "\033[32mCreated Puzzles table successfully.\033[m"
else
	echo -e "\033[31mFailed to create Puzzles table.\033[m"
	exit 1
fi

touch generate.txt
sql_query="SELECT * FROM Puzzles WHERE puzzle = '%s';"
for line in $(cat "puzzles.txt"); do
	rows=$(printf "$sql_query" "$line" | docker exec -i sudoku-postgres psql -U postgres -d postgres -t ;)
	if [[ -z "$rows" ]]; then
		echo "$line" >> "generate.txt"
	fi
done
rm generate.txt
