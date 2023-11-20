CREATE TABLE IF NOT EXISTS Puzzles (
	puzzle VARCHAR(81) PRIMARY KEY CHECK (puzzle ~ '^[0-9]+$'),
	solution VARCHAR(81) NOT NULL CHECK (solution ~ '^[1-9]+$'),
	difficulty INT NOT NULL
);
