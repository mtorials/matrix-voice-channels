module.exports = {
  devServer: {
    proxy: {
      '/': {
        target: 'https://matrix.mtorials.de',
        //changeOrigin: true,
        //secure:false,
        //logLevel: 'debug' 
      },
    }
  }
};