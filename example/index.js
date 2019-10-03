const Hermes = require('hermesjs');
const WebSocketsAdapter = require('..');

const hermes = new Hermes();

hermes.addAdapter(WebSocketsAdapter, {
  topics: ['trip__requested', 'trip__accepted'],
  topicSeparator: '__',
});

hermes.use('trip/requested', (message, next) => {
  console.log('Trip requested');
  message.reply('test', { socket: message.headers.socket }, 'trip/accepted');
  next();
});

hermes.useOutbound('trip/accepted', (message, next) => {
  console.log('Trip accepted');
  next();
});

hermes.use((err, message, next) => {
  console.log('ERROR', err);
  next();
});

hermes
  .listen()
  .then(() => {
    console.log('Listening...');
  })
  .catch(console.error);
