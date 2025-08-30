import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";

export default {
  output: 'static',
  integrations: [tailwind(), react()],
  site: 'https://marceldebruyker.github.io/wurstliga2/',
};