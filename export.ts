import Papa from 'papaparse';
import * as fs from 'fs';

const file = fs.readFileSync('temp2.csv', "utf-8");

Papa.parse(file, {
    complete: function(result) {
	let objs = 'export const GAMES: SudokuObjectProps[] = [';
	for (let puzzleIndex: number = 0; puzzleIndex < result.data.length; puzzleIndex++) {
		const colCount:number = 3;
		let data = result.data[puzzleIndex];
		if (data.length != colCount) {
			continue;
		}
		for (let i:number = 0; i < data.length; i += colCount) {
			let puzzle:string = data[i].trim();
			let sideLength:number = Math.sqrt(puzzle.length);
			let solution:string = data[i+1].trim();
			let difficulty:string = data[i+2].trim();
			//console.log("Puzzle: " + puzzle + ", solution: " + solution + ", difficulty: " + difficulty);
			let obj:string = '{"type":"classic","version":"1.0.0","selectedCell":null,"puzzle":[';
			for (let row:number = 0; row < sideLength; row++) {
				obj += '[';
				for (let col:number = 0; col < sideLength; col++) {
					let type:string = "given";
					const cellValue:string = puzzle.charAt((row*sideLength)+col);
					if (cellValue == "0"){
						type = "value";
					}
					obj += '{"type":"'
					obj += type;
					obj += '","entry":';
					obj += cellValue;
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
			obj += '"statistics":{"difficulty":"easy","internalDifficulty":';
			obj += difficulty;
			obj += ',"numHintsUsed":0,"numWrongCellsPlayed":0,"score":0,"time":0},"inNoteMode":true,"actionHistory":[]}';
			//console.log(obj + "\n");
			objs += obj;
			if (i < (data.length - 3)) {
				objs += ',';
			}
		}
		objs += ',';
	}
	objs = objs.slice(0, -1); // remove trailing comma
	objs += '];';
	console.log(objs);
  }
})
