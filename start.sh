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
	fi
fi
