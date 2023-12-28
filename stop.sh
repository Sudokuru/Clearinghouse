source utils.sh

echo "The Postgres Docker is stopping..."

SECONDS=0

if docker stop sudoku-postgres ; then
	print_green "Postgres Docker stopped successfully in $SECONDS seconds."
else
	echo -e "\033[31mPostgres Docker failed to stop.\033[m"
fi
