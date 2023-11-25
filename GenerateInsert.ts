# Given a puzzle board string returns a JSON object containing data on it
# Example Usage: bun GenerateInsert.ts 439275618051896437876143592342687951185329746697451283928734165563912874714568329

import { getPuzzleData } from 'sudokuru';

const board = process.argv[2];

console.log(getPuzzleData(board));
