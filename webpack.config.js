/*! Modified for qTranslate-KQ on 2026-09-15. See MODIFICATIONS.md for details and attribution. */
// Webpack configuration for qTranslate-KQ

module.exports = {
    entry: {
        'main': './js/main.js',
        'block-editor': './js/block-editor.js',
        'notices': './js/notices.js',
        'options': './js/options.js',
        'modules/acf': './js/acf/index.js',
    },
    output: {
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
        ]
    },
};
