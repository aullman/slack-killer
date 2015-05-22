(function(global) {
  var peer = require('./peer.js'),
    form = require('./messageform.js'),
    name;

  while (!name) {
    name = prompt('Please enter your name');
  }
  peer.initialise({
    name: name,
    RTCPeerConnection: global.mozRTCPeerConnection || global.webkitRTCPeerConnection || 
      global.RTCPeerConnection,
    RTCSessionDescription: global.mozRTCSessionDescription || global.webkitRTCSessionDescription ||
      global.RTCSessionDescription,
    RTCIceCandidate: global.mozRTCIceCandidate || global.webkitRTCIceCandidate ||
      global.RTCIceCandidate
  });
})(window);
