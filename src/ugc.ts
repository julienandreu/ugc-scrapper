import axios, { AxiosRequestHeaders } from 'axios';
import { createHash } from 'crypto';
import { anonymousSignUp } from './uas';
import { sleep } from './utils';

const baseUrl = process.env.UGC_BASE_URL ?? 'https://ugc-stg.services.api.unity.com';

export interface Content {
  id: string;
}

export interface CreateContentResponse {
  uploadThumbnailUrl: string;
  uploadThumbnailHeaders: AxiosRequestHeaders;
  uploadContentUrl: string;
  uploadContentHeaders: AxiosRequestHeaders;
  content: Content;
}

export const getHash = (content: Buffer) => createHash('md5').update(content).digest('base64');

export async function createContent(
  projectId: string,
  environmentId: string,
  name: string,
  description: string,
  contentMd5Hash?: string,
  thumbnailMd5Hash?: string,
): Promise<CreateContentResponse | null> {
  try {
    const jwt = (async () => {
      try {
        const token = await anonymousSignUp(projectId);
        if (!token) {
          throw new Error('Failed to anonymous sign-up, please try again.');
        }

        return token;
      } catch (error) {
        console.error(error);
        await sleep(500);
        const secondAttempt = await anonymousSignUp(projectId);
        if (!secondAttempt) {
          throw new Error('Failed to anonymous sign-up, please try again.');
        }

        return secondAttempt;
      }
    })();

    const url = `${baseUrl}/v1/projects/${projectId}/environments/${environmentId}/content`;
    const body = {
      name,
      description,
      visibility: 'PublicGlobal',
      tagIds: ['1001'],
      thumbnailMd5Hash,
      contentMd5Hash,
    };

    const { data } = await axios.post<CreateContentResponse>(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
        'Unity-Client-Version': process.env.UNITY_CLIENT_VERSION ?? '2021.3.4f1',
        'Unity-Client-Mode': process.env.UNITY_CLIENT_MODE ?? 'play',
      },
    });

    return data;
  } catch (error) {
    console.error(error);

    return null;
  }
}

export async function uploadFile(
  url: string,
  headers: AxiosRequestHeaders,
  fileContent: Buffer | string,
): Promise<void | null> {
  try {
    return axios.put(url, fileContent, {
      headers: {
        ...headers,
      },
    });
  } catch (error) {
    console.error(error);

    return null;
  }
}
