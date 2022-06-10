import { mkdirSync } from 'fs';
import { getGameFromNameId, getModsFromGameId } from './modio';
import { downloadFile } from './utils';

const targetDirectory = './generated';

export async function scrap(nameId: string): Promise<void> {
  console.log(`Scrapping UGC for ${nameId}`);

  const game = await getGameFromNameId(nameId);

  if (game === null) {
    throw new Error('Game not found');
  }

  const {
    id,
    name,
    name_id,
    icon: { thumb_256x256 },
  } = game;

  const gameDirectory = `${targetDirectory}/${name_id}`;
  mkdirSync(gameDirectory, { recursive: true });

  await downloadFile(thumb_256x256, `${gameDirectory}/${name_id}.png`);
  console.log(`Game "${name}" icon downloaded!`);

  const mods = await getModsFromGameId(id);

  const modsDirectory = `${gameDirectory}/mods/`;
  mkdirSync(modsDirectory, { recursive: true });

  const downloadModPromise = mods.map(async (mod) => {
    const modDirectory = `${modsDirectory}/${mod.name_id}`;
    mkdirSync(modDirectory, { recursive: true });

    const downloadLogoPromise = downloadFile(mod.logo.thumb_640x360, `${modDirectory}/logo.png`);
    const downloadModPromise = downloadFile(mod.logo.thumb_640x360, `${modDirectory}/binary`);

    await downloadLogoPromise;
    await downloadModPromise;

    return mod;
  });

  const downloadedMods = await Promise.all(downloadModPromise);

  const modsToCreate = downloadedMods.map((mod) => {});

  await Promise.all(modsToCreate);

  console.log(`${modsToCreate.length} mods for the game "${name}" created!`);
}
