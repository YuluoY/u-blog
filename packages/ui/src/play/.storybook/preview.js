import 'ucc-ui/dist/index.css'

/** @type { import('@storybook/vue3').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    controls: { expanded: true }
  }
};


export default preview;
