var dataChannels = [],
  msgHistory = [];

module.exports = {
  add: function (pc) {
    pc.ondatachannel = function(evt) {
      var channel = evt.channel;

      console.log('ondatachannel', channel.label, channel.readyState);
      channel.binaryType = 'arraybuffer';

      channel.onopen = function() {
        console.info('onopen');
        // Send the whole message history to them
        msgHistory.forEach(function (msg) {
          channel.send(msg);
        });
        dataChannels.push(channel);
      };

      channel.onmessage = function(evt) {
        var data = evt.data;
        if (typeof data === 'string') {
          console.log('onmessage:', data);
          msgHistory.push(data);
          // Broadcast to every data channel
          dataChannels.forEach(function (dc) {
            dc.send(data);
          });
        } else {
          console.log('onmessage:', new Uint8Array(evt.data));
        }
      };
      channel.onclose = function() {
        console.info('onclose');
        dataChannels = dataChannels.filter(function (el) {
          return el !== channel;
        });
      };
      channel.onerror = function (error) {
        throw error;
      };
    };
  }
};