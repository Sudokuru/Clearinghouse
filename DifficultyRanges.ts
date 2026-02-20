export interface DifficultyRange {
  name: string;
  minDifficulty: number;
  maxDifficulty: number;
}

export const NOVICE: DifficultyRange = {
  name: "Novice",
  minDifficulty: -33820,
  maxDifficulty: -33820,
};

export const AMATEUR: DifficultyRange = {
  name: "Amateur",
  minDifficulty: -20979,
  maxDifficulty: -20967,
};

export const LAYMAN: DifficultyRange = {
  name: "Layman",
  minDifficulty: -13277,
  maxDifficulty: -12329,
};

export const TRAINEE: DifficultyRange = {
  name: "Trainee",
  minDifficulty: -7587,
  maxDifficulty: -7090,
};

export const PROTEGE: DifficultyRange = {
  name: "Protege",
  minDifficulty: -5544,
  maxDifficulty: -5114,
};

export const PROFESSIONAL: DifficultyRange = {
  name: "Professional",
  minDifficulty: -2961,
  maxDifficulty: -2468,
};

export const PUNDIT: DifficultyRange = {
  name: "Pundit",
  minDifficulty: -1383,
  maxDifficulty: -1383,
};

export const MASTER: DifficultyRange = {
  name: "Master",
  minDifficulty: 54000000,
  maxDifficulty: 54000000,
};

export const GRANDMASTER: DifficultyRange = {
  name: "Grandmaster",
  minDifficulty: 58000000,
  maxDifficulty: 58000000,
};

export const DIFFICULTY_RANGES: DifficultyRange[] = [
  NOVICE,
  AMATEUR,
  LAYMAN,
  TRAINEE,
  PROTEGE,
  PROFESSIONAL,
  PUNDIT,
  MASTER,
  GRANDMASTER,
];
