import axios from 'axios';

const baseUrl = 'https://api.mod.io/v1';

interface Media {
  filename: string;
  original: string;
}

interface Icon extends Media {
  thumb_64x64: string;
  thumb_128x128: string;
  thumb_256x256: string;
}

interface Logo extends Media {
  thumb_320x180: string;
  thumb_640x360: string;
  thumb_1280x720: string;
}

interface Game {
  id: number;
  icon: Icon;
  logo: Logo;
  header: Media;
  name: string;
  name_id: string;
  summary: string;
}

interface Hash {
  md5: string;
}

interface Download {
  binary_url: string;
}

interface Tag {
  name: string;
}

interface File {
  id: number;
  filehash: Hash;
  filenane: string;
  version: string | number | null;
  download: Download;
  tags: Tag[];
}

interface Mod {
  id: number;
  game_id: number;
  logo: Logo;
  name: string;
  name_id: string;
  summary: string;
  description: string;
  description_plaintext: string;
  modfile: File;
}

export async function getGameFromNameId(nameId: string): Promise<Game | null> {
  try {
    const url = `${baseUrl}/games`;
    const params = {
      api_key: process.env.MODIO_API_KEY,
      name_id: nameId,
    };

    const { data } = await axios.get<{ data: Game[] }>(url, {
      params,
    });

    const { data: games } = data;

    if (games.length === 0) {
      throw new Error('Game not found');
    }

    if (games.length > 1) {
      throw new Error('More than one game found');
    }

    const [{ id, icon, logo, header, name, name_id, summary }] = games;

    return { id, icon, logo, header, name, name_id, summary };
  } catch (error) {
    console.error(error);

    return null;
  }
}

export async function getModsFromGameId(gameId: number): Promise<Mod[]> {
  try {
    const url = `${baseUrl}/games/${gameId}/mods`;
    const params = {
      api_key: process.env.MODIO_API_KEY,
    };

    const { data } = await axios.get<{ data: Mod[] }>(url, {
      params,
    });

    const { data: mods } = data;

    return mods;
  } catch (error) {
    console.error(error);

    return [];
  }
}
