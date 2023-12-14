import Papa from 'papaparse';
import * as fs from 'fs';

const file = fs.readFileSync('temp2.csv', "utf-8");

Papa.parse(file, {
    complete: function(result) {
	const colCount:number = 3;
	let data = result.data[0];
	let objs = 'export const GAMES: SudokuObjectProps[] = [';
	for (let i:number = 0; i < data.length; i += colCount) {
		let puzzle:string = data[i].trim();
		let sideLength:number = Math.sqrt(puzzle.length);
		let solution:string = data[i+1].trim();
		let difficulty:string = data[i+2].trim();
		//console.log("Puzzle: " + puzzle + ", solution: " + solution + ", difficulty: " + difficulty);
		let obj:string = '{"type":"classic","version":"1.0.0","selectedCell":{"r":0,"c":0},"puzzle":[';
		for (let row:number = 0; row < sideLength; row++) {
			obj += '[';
			for (let col:number = 0; col < sideLength; col++) {
				obj += '{"type":"given","entry":';
				obj += puzzle.charAt((row*sideLength)+col);
				obj += '}';
				if (col < (sideLength - 1)) {
					obj += ',';
				}
			}
			obj += ']';
			if (row < (sideLength - 1)) {
				obj += ',';
			}
		}
		obj += '],';
		obj += '"puzzleSolution":';
		obj += '[';
		for (let row:number = 0; row < sideLength; row++) {
			obj += '[';
			for (let col:number = 0; col < sideLength; col++) {
				obj += solution.charAt((row*sideLength)+col);
				if (col < (sideLength - 1)) {
					obj += ',';
				}
			}
			obj += ']'
			if (row < (sideLength - 1)) {
				obj += ',';
			}
		}
		obj += '],';
		obj += '"statistics":{"difficulty":"standard","internalDifficulty":';
		obj += difficulty;
		obj += ',"numHintsUsed":0,"numWrongCellsPlayed":0,"score":0,"time":0},"inNoteMode":true,"actionHistory":[]}';
		//console.log(obj + "\n");
		objs += obj;
		if (i < (data.length - 3)) {
			objs += ',';
		}
	}
	objs += '];';
	console.log(objs);
  }
})
