echo "The Postgres Docker is stopping..."

SECONDS=0

if docker stop sudoku-postgres ; then
	echo -e "\033[32mPostgres Docker stopped successfully in $SECONDS seconds.\033[m"
else
	echo "Postgres Docker failed to stop."
fi
