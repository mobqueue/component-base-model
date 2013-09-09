
/**
 * Dependencies
 */

var Backbone = require('backbone')
  , BackboneModel = require('backbone-model')
  , debug = require('debug')('base-model')
  , pusher = require('pusher')
  , XHR = require('xhr');

/**
 * Expose `BaseModel`
 */

var BaseModel = module.exports = BackboneModel.extend({
  name: 'basemodel'
});

/**
 * Initialize
 */

BaseModel.prototype.initialize = function() {
  if (this.id) {
    this._register();
  } else {
    var self = this;
    this.once('sync', function() {
      self._register();
    });
  }

  this.postInitialize();
};

/**
 * Register
 */

BaseModel.prototype._register = function() {
  var channelName = this.name + '-' + this.id;
  var channel = pusher.channel(channelName);
  var self = this;

  if (!channel) {
    channel = pusher.subscribe(channelName);
  }

  debug('listening to ', channelName);

  channel.bind('update', function(data) {
    debug('update', data);
    self.set(data);
  });

  channel.bind('delete', function(data) {
    self.trigger('destroy', self, self.collection);
    pusher.unsubscribe(channelName);
  });

  if (this.user) {
    this.user.on('logout', function() {
      pusher.unsubscribe(channelName);
    });
  }
};

/**
 * Empty postInitialize
 */

BaseModel.prototype.postInitialize = function() {};

/**
 * Custom Sync
 */

BaseModel.prototype.sync = function(method, model, options) {
  options.url = window.API_URL;

  if (typeof model.url === 'string') {
    options.url += model.url;
  } else {
    options.url += model.url();
  }

  options.headers = XHR.getHeaders();
  options.xhrFields = {
    withCredentials: window.device === undefined && options.url.indexOf('private') !== -1
  };

  debug('sync', method, model, options);

  return Backbone.sync.call(this, method, model, options);
};
