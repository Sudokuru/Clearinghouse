import Papa from 'papaparse';
import * as fs from 'fs';

const file = fs.readFileSync('temp2.csv', "utf-8");

Papa.parse(file, {
    complete: function(result) {
	const colCount:int = 3;
	for (let i:int = 0; i < (result.data[0].length) / 3; i++) {
		console.log("Puzzle: " + result.data[0][i*3] + ", solution: " + result.data[0][(i*3)+1] + ", difficulty: " + result.data[0][(i*3)+2]);
	}
  }
})
