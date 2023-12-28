source utils.sh

bash stop.sh

echo "The Postgres Docker is being deleted..."

SECONDS=0

if docker rm -f sudoku-postgres ; then
	print_green "Postgres Docker deleted successfully in $SECONDS seconds."
else
	echo -e "\033[31mPostgres Docker failed to delete.\033[m"
fi
