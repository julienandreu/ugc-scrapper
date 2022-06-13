import axios, { AxiosRequestHeaders } from 'axios';
import { anonymousSignUp } from './uas';

const baseUrl = process.env.UGC_BASE_URL ?? 'https://ugc-stg.services.api.unity.com';

interface Content {
  id: string;
}

interface CreateContentResponse {
  uploadThumbnailUrl: string;
  uploadThumbnailHeaders: string;
  uploadContentUrl: string;
  uploadContentHeaders: string;
  content: Content;
}

export async function createContent(
  projectId: string,
  environmentId: string,
  name: string,
  description: string,
  contentMd5Hash?: string,
  thumbnailMd5Hash?: string,
): Promise<any | null> {
  try {
    const jwt = await anonymousSignUp(projectId);
    if (!jwt) {
      throw new Error('Failed to anonymous sign-up, please try again.');
    }

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
): Promise<any | null> {
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
