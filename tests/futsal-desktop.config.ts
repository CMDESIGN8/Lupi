import {defineConfig} from 'vitest/config';
export default defineConfig({esbuild:{jsx:'automatic'},test:{environment:'jsdom',include:['tests/futsal-desktop.test.tsx'],css:false}});
