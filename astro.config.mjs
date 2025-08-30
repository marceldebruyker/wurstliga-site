import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";

export default {
  output: 'server',
  integrations: [tailwind(), react()],
};