module.exports = {
  launch: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: process.env.HEADLESS !== 'false' ? 'new' : false,
  },
  server: [{
    command: 'npm run server -- -p 4488',
    host: '127.0.0.1',
    launchTimeout: 5000,
    port: 4488,
  }],
};
