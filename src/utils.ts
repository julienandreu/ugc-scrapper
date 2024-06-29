import Axios from 'axios';
import { createWriteStream } from 'fs';

export async function downloadFile(fileUrl: string, outputLocationPath: string): Promise<void> {
  return Axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then(function (response) {
    response.data.pipe(createWriteStream(outputLocationPath));
  });
}

export const sleep = async (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// Execute sequentially a list of promises.
export const awaitedMap = async <T, R>(array: T[], callback: (value: T) => R): Promise<(R | null)[]> => {
  const results = [];

  for (const value of array) {
    try {
      const result = await callback(value);
      results.push(result);
    } catch (error) {
      console.error(error);
      results.push(null);
    }
  }

  return results;
};
