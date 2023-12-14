import Papa from 'papaparse';
import * as fs from 'fs';

const file = fs.readFileSync('temp2.csv', "utf-8");

Papa.parse(file, {
    complete: function(result) {
	const colCount:int = 3;
	let data = result.data[0];
	for (let i:int = 0; i < data.length; i += 3) {
		let puzzle = data[i]
		let solution = data[i+1]
		let difficulty = data[i+2]
		console.log("Puzzle: " + puzzle + ", solution: " + solution + ", difficulty: " + difficulty);
		let obj:string = '[{"type":"classic","version":"1.0.0","selectedCell":{"r":3,"c":0},"puzzle":[';
		console.log(obj + "\n");
	}
  }
})
