SELECT difficulty, COUNT(*) AS occurrences
FROM Puzzles
GROUP BY difficulty
ORDER BY difficulty ASC;