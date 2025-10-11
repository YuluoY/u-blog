module.exports = {
  plugins: [
    require('autoprefixer')(),
    require('cssnano')({
      preset: 'default'
    }),
    require('postcss-preset-env')({
      stage: 1,
      features: {
        'nesting-rules': true
      }
    })
  ]
}
