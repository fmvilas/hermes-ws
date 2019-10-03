const http = require('http');
const socketio = require('socket.io');
const { Adapter, Message } = require('hermesjs');

class WebSocketsAdapter extends Adapter {
  name() {
    return 'WebSockets adapter';
  }

  async connect() {
    return this._connect();
  }

  async send(message, options) {
    return this._send(message, options);
  }

  _connect() {
    return new Promise((resolve, reject) => {
      let resolved = false;

      this.options.httpServer = this.options.httpServer || http.createServer();
      this.options.httpServerSettings = this.options.httpServerSettings || {};
      this.options.httpServerSettings.path = this.options.httpServerSettings.path || '/ws';
      this.io = socketio(this.options.httpServer, this.options.httpServerSettings);

      this.io.on('connection', socket => {
        socket.onevent = message => {
          this.emit('message', this._createMessage(message, socket));
        };
        socket.on('error', error => {
          this.emit('error', error);
        });
      });

      this.options.httpServer.on('error', error => {
        if (!resolved) return reject(error);
        this.emit('error', error);
      });

      this.options.httpServer.listen(this.options.port || 3000, () => {
        resolve(this);
        resolved = true;
      });
    });
  }

  _send (message) {
    return new Promise((resolve) => {
      const socket = message.headers && message.headers.socket ? message.headers.socket : this.io;
      socket.emit(this._translateHermesRoute(message.topic), message.payload);
      resolve();
    });
  }

  _createMessage(msg, socket) {
    return new Message(this.hermes, msg.data[1], { socket }, this._translateTopicName(msg.data[0]));
  }

  _translateTopicName(topicName) {
    if (this.options.topicSeparator === undefined) return topicName;
    return topicName.replace(new RegExp(`${this.options.topicSeparator}`, 'g'), '/');
  }

  _translateHermesRoute(hermesRoute) {
    if (this.options.topicSeparator === undefined) return hermesRoute;
    return hermesRoute.replace(/\//g, this.options.topicSeparator);
  }
}

module.exports = WebSocketsAdapter;
