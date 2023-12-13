import Papa from 'papaparse';
import * as fs from 'fs';

const file = fs.readFileSync('temp2.csv', "utf-8");

Papa.parse(file, {
    complete: function(result) {
	const colCount:int = 3;
	let data = result.data[0];
	for (let i:int = 0; i < data.length; i += 3) {
		console.log("Puzzle: " + data[i] + ", solution: " + data[i+1] + ", difficulty: " + data[i+2]);
	}
  }
})
