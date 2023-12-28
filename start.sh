source utils.sh

echo "The Postgres Docker is starting..."

SECONDS=0
if [[ -z "$GENERATE_TIME_LIMIT" ]]; then
	GENERATE_TIME_LIMIT=60
fi
if [[ -z "$GENERATE_THREADS" ]]; then
	GENERATE_THREADS=1
fi

if docker run --name sudoku-postgres -e POSTGRES_PASSWORD=sudokuru -d -p 5432:5432 postgres ; then
	print_green "Postgres Docker started successfully in $SECONDS seconds."
else
	echo "sudoku-postgres already exists, attempting restart..."
	if docker start sudoku-postgres ; then
		echo -e "\033[32mPostgres Docker restarted successfully in $SECONDS seconds.\033[m"
	else
		echo -e "\033[31mPostgres Docker failed to start.\033[m"
		exit 1
	fi
fi

sleep 3 # Give time for database to spin up before executing commands in it

if cat ./create-puzzles-table.sql | docker exec -i sudoku-postgres psql -U postgres -d postgres ; then
	echo -e "\033[32mCreated Puzzles table successfully.\033[m"
else
	echo -e "\033[31mFailed to create Puzzles table.\033[m"
	exit 1
fi

cat ./puzzles.sql | docker exec -i sudoku-postgres psql -U postgres -d postgres > /dev/null

touch inserts.sql
sql_query="SELECT * FROM Puzzles WHERE puzzle = '%s';"
let thread=0
total_puzzles=$(grep -c . "puzzles.txt")
solved_puzzles=$(grep -c . "puzzles.sql")
total_steps=$(echo $total_puzzles-$solved_puzzles | bc)
current_step=0
for line in $(cat "puzzles.txt"); do
	if [[ $SECONDS -gt $GENERATE_TIME_LIMIT ]]; then
    		break
  	fi
	rows=$(printf "$sql_query" "$line" | docker exec -i sudoku-postgres psql -U postgres -d postgres -t ;)
	if [[ -z "$rows" ]]; then
		if [[ "$thread" == "$GENERATE_THREADS" ]]; then
			wait $child_pid
			let thread=0
		else
			let thread++
		fi
		$(bun GenerateInsert.ts $line >> "inserts.sql") &
		child_pid=$!

		current_step=$((current_step + 1))

		# Calculate the percentage of completion
  		percentage=$((current_step * 100 / total_steps))

  		# Fill the progress bar based on the percentage
  		filled_bar="${progress_bar:0:percentage}"

  		# Print the progress bar
  		echo -ne "\r[${filled_bar} ] ${percentage}%"
	fi
done
wait

cat inserts.sql >> puzzles.sql
cat ./inserts.sql | docker exec -i sudoku-postgres psql -U postgres -d postgres > /dev/null
rm inserts.sql

if [[ $current_step -gt 0 ]]; then
	echo " Added $current_step new puzzles to puzzles.sql"
else
	echo "Finished without adding any new puzzles to puzzles.sql"
fi
