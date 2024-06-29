import { mkdirSync, readFileSync } from 'fs';
import { AvailableProvider, DownloadedContent, providerFactory } from './providers';
import { Content, createContent, getHash, uploadFile } from './ugc';
import { downloadFile } from './utils';

const targetDirectory = './generated';

export const scrap =
  (providerName: AvailableProvider) => (name: string) => (projectId: string) => async (environmentId: string) => {
    console.log(`Scrapping UGC for ${name} using ${providerName} provider`);

    // Build provider
    const provider = providerFactory.build(providerName);

    // Create generated game directory
    const gameDirectory = `${targetDirectory}/${name}`;
    mkdirSync(gameDirectory, { recursive: true });

    // Retrieve provided content
    const providedContents = await provider.getContentFromGameName(name);
    console.log(`${providedContents.length} mod(s) retrieved for game ${name}`);

    // Create contents directory
    const contentsDirectory = `${gameDirectory}/contents`;
    mkdirSync(contentsDirectory, { recursive: true });

    // Download mod icon and binary
    const downloadedContentsPromise = providedContents.map(async (content): Promise<DownloadedContent> => {
      // Create content directory
      const contentDirectory = `${contentsDirectory}/${content.name}`;
      mkdirSync(contentDirectory, { recursive: true });

      // Download mod icon
      console.log(`Logo download for content "${content.name}" in progress...`);
      const thumbnailFilename = `${contentDirectory}/logo.png`;
      const downloadThumbnailPromise = downloadFile(content.thumbnailUrl, thumbnailFilename);

      // Download mod binary
      console.log(`Binary download for mod "${content.name}" in progress...`);
      const binaryFilename = `${contentDirectory}/binary`;
      const downloadBinaryPromise = downloadFile(content.thumbnailUrl, binaryFilename); // FIXME: Use the mod.modfile.download.binary_url as URL to download the real binary file, here for weight reason, we just want to test the download process¸
      // const downloadBinaryPromise = downloadFile(content.contentUrl, binaryFilename);

      // Wait for both download promises
      await downloadThumbnailPromise;
      console.log(`Thumbnail downloaded for mod "${content.name}"`);
      await downloadBinaryPromise;
      console.log(`Binary downloaded for mod "${content.name}"`);

      return {
        ...content,
        binaryPath: binaryFilename,
        thumbnailPath: thumbnailFilename,
      };
    });

    const downloadedContents = await Promise.all(downloadedContentsPromise);

    const createdContentsPromise = downloadedContents.map(async (downloadedContent): Promise<Content['id'] | null> => {
      try {
        const thubmnailFilecontent = readFileSync(downloadedContent.thumbnailPath);
        const base64ThumbnailMd5Hash = getHash(thubmnailFilecontent);

        const binaryFilecontent = readFileSync(downloadedContent.binaryPath);
        const base64BVinaryMd5Hash = getHash(binaryFilecontent);

        // Create UGC content
        console.log(`Creating UGC content...`);
        const createContentResponse = await createContent(
          projectId,
          environmentId,
          downloadedContent.name,
          downloadedContent.description,
          base64BVinaryMd5Hash,
          base64ThumbnailMd5Hash,
        );
        if (!createContentResponse) {
          throw new Error(`Failed to create content for mod ${downloadedContent.name}`);
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
        console.log(`Uploading thumbnail for mod "${downloadedContent.name}"...`);
        uploadFile(uploadThumbnailUrl, uploadThumbnailHeaders, thubmnailFilecontent).then(() =>
          console.log(`Thumbnail uploaded for mod "${downloadedContent.name}"`),
        );

        console.log(`Uploading content for mod "${downloadedContent.name}"...`);
        uploadFile(uploadContentUrl, uploadContentHeaders, binaryFilecontent).then(() =>
          console.log(`Content uploaded for mod "${downloadedContent.name}"`),
        );

        return id;
      } catch (error) {
        console.error(error);
        return null;
      }
    });

    const createdContents = await createdContentsPromise;

    console.log(
      `${createdContents.filter(Boolean).length}/${providedContents.length} contents for the game "${name}" created!`,
    );
  };
