import Papa from 'papaparse';
import * as fs from 'fs';

const file = fs.readFileSync('temp2.csv', "utf-8");

Papa.parse(file, {
    complete: function(result) {
	let objs:string = 'import { Puzzle } from \'./Puzzle.type\';\n';
	objs += 'export const PUZZLES: Puzzle[] = [';
	for (let puzzleIndex: number = 0; puzzleIndex < result.data.length; puzzleIndex++) {
		const colCount:number = 3;
		let data = result.data[puzzleIndex];
		if (data.length != colCount) {
			continue;
		}
		for (let i:number = 0; i < data.length; i += colCount) {
			let puzzle:string = data[i].trim();
			let solution:string = data[i+1].trim();
			let difficulty:string = data[i+2].trim();
			//console.log("Puzzle: " + puzzle + ", solution: " + solution + ", difficulty: " + difficulty);
			objs += `{"p":"${puzzle}","s":"${solution}","d":${difficulty}},`;
		}
	}
	objs = objs.slice(0, -1); // remove trailing comma
	objs += '];';
	console.log(objs);
  }
})
