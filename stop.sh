echo "The Postgres Docker is stopping..."

SECONDS=0

if docker stop sudoku-postgres ; then
	echo -e "\033[32mPostgres Docker stopped successfully in $SECONDS seconds.\033[m"
else
	echo -e "\033[31mPostgres Docker failed to stop.\033[m"
fi
