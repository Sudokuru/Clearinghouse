bash stop.sh

echo "The Postgres Docker is being deleted..."

SECONDS=0

if docker rm -f sudoku-postgres ; then
	echo "Postgres Docker deleted successfully in $SECONDS seconds."
else
	echo "Postgres Docker failed to delete."
fi
