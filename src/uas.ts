import axios from 'axios';

const baseUrl = process.env.UAS_BASE_URL ?? 'https://player-auth-stg.services.api.unity.com';

interface User {
  id: string;
  disabled: boolean;
  externalIds: string[];
}

interface AnonymousSignUpResponse {
  userId: string;
  idToken: string;
  sessionToken: string;
  expiresIn: number;
  user: User;
}

export async function anonymousSignUp(projectId: string): Promise<AnonymousSignUpResponse['idToken'] | null> {
  try {
    const url = `${baseUrl}/v1/authentication/anonymous`;
    const body = {};

    const { data } = await axios.post<AnonymousSignUpResponse>(url, body, {
      headers: {
        'Content-Type': 'application/json',
        ProjectId: projectId,
      },
    });

    return data?.idToken;
  } catch (error) {
    console.error(error);

    return null;
  }
}
