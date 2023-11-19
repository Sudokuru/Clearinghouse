bash stop.sh

echo "The Postgres Docker is being deleted..."

SECONDS=0

if docker rm -f sudoku-postgres ; then
	echo -e "\033[32mPostgres Docker deleted successfully in $SECONDS seconds.\033[m"
else
	echo "Postgres Docker failed to delete."
fi
