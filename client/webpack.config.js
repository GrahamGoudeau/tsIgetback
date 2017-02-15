var CopyWebpackPlugin = require("copy-webpack-plugin");
var distDir = __dirname + "/dist";
module.exports = {
    entry: "./src/index.tsx",
    output: {
        filename: "bundle.js",
        path: distDir
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",
    resolve: {
        extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },
    plugins: [
        new CopyWebpackPlugin([
                { from: "node_modules/react/dist/react.min.js", to: distDir },
                { from: "node_modules/react-dom/dist/react-dom.min.js", to: distDir },
                { from: "src/styles/*.css", to: distDir }
            ])
    ],

    module: {
        loaders: [
            { test: /\.tsx?$/, loader: "awesome-typescript-loader" }
        ],
        preLoaders: [
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { test: /\.js$/, loader: "source-map-loader" }
        ]
    },
    externals: {
        "react": "React",
        "react-dom": "ReactDOM"
    },
};
