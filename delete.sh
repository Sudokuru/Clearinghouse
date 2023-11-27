bash stop.sh

echo "The Postgres Docker is being deleted..."

SECONDS=0

if docker rm -f sudoku-postgres ; then
	echo -e "\033[32mPostgres Docker deleted successfully in $SECONDS seconds.\033[m"
	# Clear out puzzles.sql
	> puzzles.sql
	echo -e "\033[32mCleared puzzles.sql\033[m"
else
	echo -e "\033[31mPostgres Docker failed to delete.\033[m"
fi
