import { defineConfig } from 'vite';
import type { Plugin, PluginOption } from 'vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath, URL } from 'url';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import contentCollections from '@content-collections/vite';

function limitRouteGeneratorToSsr(pluginOption: PluginOption): PluginOption {
  if (Array.isArray(pluginOption)) {
    return pluginOption.map(limitRouteGeneratorToSsr);
  }

  if (!pluginOption || typeof pluginOption !== 'object') {
    return pluginOption;
  }

  if (!('name' in pluginOption)) {
    return pluginOption;
  }

  if (pluginOption.name !== 'tanstack:router-generator') {
    return pluginOption;
  }

  const plugin = pluginOption as Plugin;

  return {
    ...plugin,
    applyToEnvironment(environment) {
      const baseResult =
        typeof plugin.applyToEnvironment === 'function'
          ? plugin.applyToEnvironment(environment)
          : true;

      return baseResult && environment.name === 'ssr';
    },
  } satisfies Plugin;
}

/**
 * Vite configuration
 * https://vite.dev/config/
 */
const config = defineConfig({
  server: {
    allowedHosts: ['.trycloudflare.com', '.tanstarter.dev'],
    watch: {
      // TanStack's route generator keeps rewriting this file with identical
      // contents on Windows, which causes endless HMR churn in local dev.
      ignored: ['**/src/routeTree.gen.ts'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    devtools({
      eventBusConfig: {
        port: 0,
      },
    }),
    tailwindcss(),
    contentCollections(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    // https://tanstack.dev/start/latest/docs/framework/react/build-from-scratch
    ...tanstackStart({
      srcDirectory: 'src',
      start: { entry: './start.tsx' },
      server: { entry: './server.ts' },
    }).map(limitRouteGeneratorToSsr),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
    // https://developers.cloudflare.com/workers/vite-plugin/
    cloudflare({
      viteEnvironment: {
        name: 'ssr',
      },
    }),
  ],
});

export default config;
