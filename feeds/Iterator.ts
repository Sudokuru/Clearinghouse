import { createReadStream } from "fs";
import { createInterface } from "readline";

export function getIterator(filePath: string): {
  iterator: AsyncIterator<string>,
  close: () => void
} {
  // Create stream
  const stream = createReadStream(filePath);
  const rlInterface = createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  // Handle potential errors
  stream.on('error', (error) => {
    throw new Error(`Error reading file ${filePath}: ${error.message}`);
  });
  
  return {
    iterator: rlInterface[Symbol.asyncIterator](),
    close: () => {
      rlInterface.close();
      stream.close();
    }
  };
}
