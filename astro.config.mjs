import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";

export default {
  output: 'hybrid',
  integrations: [tailwind(), react()],
};