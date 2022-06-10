import Axios from 'axios';
import { createWriteStream } from 'fs';

export async function downloadFile(fileUrl: string, outputLocationPath: string): Promise<any> {
  return Axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then(function (response) {
    response.data.pipe(createWriteStream(outputLocationPath));
  });
}
