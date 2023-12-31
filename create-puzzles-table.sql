CREATE TABLE IF NOT EXISTS Puzzles (
	puzzle VARCHAR(81) PRIMARY KEY CHECK (puzzle ~ '^[0-9]+$'),
	solution VARCHAR(81) NOT NULL CHECK (solution ~ '^[1-9]+$'),
	difficulty INT NOT NULL,
	naked_single_drill INT NOT NULL,
	hidden_single_drill INT NOT NULL,
	naked_pair_drill INT NOT NULL,
	hidden_pair_drill INT NOT NULL,
	pointing_pair_drill INT NOT NULL,
	naked_triplet_drill INT NOT NULL,
	hidden_triplet_drill INT NOT NULL,
	pointing_triplet_drill INT NOT NULL,
	naked_quadruplet_drill INT NOT NULL,
	hidden_quadruplet_drill INT NOT NULL
);
