import { createHash } from 'crypto';
import { mkdirSync, readFileSync } from 'fs';
import { getGameFromNameId, getModsFromGameId } from './modio';
import { createContent, uploadFile } from './ugc';
import { downloadFile } from './utils';

const targetDirectory = './generated';

export async function scrap(nameId: string, projectId: string, environmentId: string): Promise<void> {
  console.log(`Scrapping UGC for ${nameId}`);

  // Retrieve Game
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

  // Create generated game directory
  const gameDirectory = `${targetDirectory}/${name_id}`;
  mkdirSync(gameDirectory, { recursive: true });

  // Download game icon
  await downloadFile(thumb_256x256, `${gameDirectory}/${name_id}.png`);
  console.log(`Game "${name}" icon downloaded!`);

  // Retrieve Mods
  const mods = await getModsFromGameId(id);
  console.log(`${mods.length} mod(s) retrieved for game ${name}`);

  // Create mods directory
  const modsDirectory = `${gameDirectory}/mods`;
  mkdirSync(modsDirectory, { recursive: true });

  // Download mod icon and binary
  const downloadModsPromise = mods.map(async (mod) => {
    try {
      // Create mod directory
      const modDirectory = `${modsDirectory}/${mod.name_id}`;
      mkdirSync(modDirectory, { recursive: true });

      // Download mod icon
      console.log(`Logo download for mod "${mod.name_id}" in progress...`);
      const logoFilename = `${modDirectory}/logo.png`;
      const downloadLogoPromise = downloadFile(mod.logo.thumb_640x360, logoFilename);

      // Download mod binary
      console.log(`Binary download for mod "${mod.name_id}" in progress...`);
      const modFilename = `${modDirectory}/binary`;
      const downloadModPromise = downloadFile(mod.logo.thumb_320x180, modFilename); // FIXME: Use the mod.modfile.download.binary_url as URL to download the real binary file, here for weight reason, we just want to test the download process¸
      // const downloadModPromise = downloadFile(mod.modfile.download.binary_url, modFilename);

      // Wait for both download promises
      await downloadLogoPromise;
      console.log(`Logo downloaded for mod "${mod.name_id}"`);
      await downloadModPromise;
      console.log(`Mod downloaded for mod "${mod.name_id}"`);

      // File content
      const logoContent = readFileSync(logoFilename);
      const modContent = readFileSync(modFilename);

      // Calculate base64 digest md5 files hash
      const base64LogoMd5Hash = createHash('md5').update(logoContent).digest('base64');
      const base64ModMd5Hash = createHash('md5').update(modContent).digest('base64');

      // Create UGC content
      console.log(`Creating UGC content...`);
      const createContentResponse = await createContent(
        projectId,
        environmentId,
        mod.name,
        mod.description_plaintext,
        base64ModMd5Hash,
        base64LogoMd5Hash,
      );
      if (!createContentResponse) {
        throw new Error(`Failed to create content for mod ${mod.name}`);
      }

      const {
        uploadThumbnailUrl,
        uploadThumbnailHeaders,
        uploadContentUrl,
        uploadContentHeaders,
        content: { id },
      } = createContentResponse;

      console.log(`UGC content created with id ${id}`);

      // Upload both thumbnail and content
      console.log(`Uploading thumbnail for mod "${mod.name_id}"...`);
      const uploadThumbnailPromise = uploadFile(uploadThumbnailUrl, uploadThumbnailHeaders, logoContent);

      console.log(`Uploading content for mod "${mod.name_id}"...`);
      const uploadContentPromise = uploadFile(uploadContentUrl, uploadContentHeaders, modContent);

      // Wait for both upload promises
      await uploadThumbnailPromise;
      console.log(`Thumbnail uploaded for mod "${mod.name_id}"`);
      await uploadContentPromise;
      console.log(`Content uploaded for mod "${mod.name_id}"`);

      return id;
    } catch (error) {
      console.dir({ error }, { depth: null }); // FIXME: Cover error management
      return null;
    }
  });

  const downloadedMods = await Promise.all(downloadModsPromise);

  const modsToCreate = downloadedMods.filter(Boolean);

  console.log(`${modsToCreate.length}/${mods.length} mods for the game "${name}" created!`);
}
