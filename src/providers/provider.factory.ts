import { Provider } from './provider.interface';
import { ModioProvider } from './modio';

export const availableProviders = ['modio'] as const;

export type AvailableProvider = typeof availableProviders[number];

function build(provider: AvailableProvider): Provider {
  switch (provider) {
    case 'modio':
      return ModioProvider;
    default:
      throw new Error(`Unknown provider ${provider}`);
  }
}

export const providerFactory = {
  build,
};
