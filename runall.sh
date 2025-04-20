#!/bin/bash

GENERATE_TIME_LIMIT=14400
GENERATE_THREADS=10

for puzzle_file in puzzles1.txt puzzles2.txt puzzles3.txt; do
  echo "Processing $puzzle_file..."
  echo 'y' | GENERATE_TIME_LIMIT=$GENERATE_TIME_LIMIT GENERATE_THREADS=$GENERATE_THREADS UNSOLVED_PUZZLE_FILE=$puzzle_file bun ingest_puzzles.ts
done