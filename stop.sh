echo "The Postgres Docker is stopping..."

SECONDS=0

if docker stop sudoku-postgres ; then
	echo "Postgres Docker stopped successfully in $SECONDS seconds."
else
	echo "Postgres Docker failed to stop."
fi
