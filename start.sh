echo "The Postgres Docker is starting..."

SECONDS=0

if docker run --name sudoku-postgres -e POSTGRES_PASSWORD=sudokuru -d postgres ; then
	echo "Postgres Docker started successfully in $SECONDS seconds."
else
	echo "Postgres Docker failed to start."
fi
