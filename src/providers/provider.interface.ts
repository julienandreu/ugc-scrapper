export interface ProvidedContent {
  name: string;
  description: string;
  contentUrl: string;
  thumbnailUrl: string;
}

export interface DownloadedContent extends ProvidedContent {
  binaryPath: string;
  thumbnailPath: string;
}

export interface Provider {
  getContentFromGameName(name: string): Promise<ProvidedContent[]>;
}
