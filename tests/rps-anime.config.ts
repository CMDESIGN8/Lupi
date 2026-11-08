import { defineConfig } from 'vitest/config';
export default defineConfig({esbuild:{jsx:'automatic'},test:{environment:'jsdom',include:['tests/rps-anime-adapted.test.tsx'],css:false}});
