(function(global) {
  var peer = require('./peer.js'),
    form = require('./messageform.js'),
    imagedropper = require('./imagedropper.js'),
    name;

  while (!name) {
    name = prompt('Please enter your name');
  }
  peer.init({
    name: name,
    RTCPeerConnection: global.mozRTCPeerConnection || global.webkitRTCPeerConnection || 
      global.RTCPeerConnection,
    RTCSessionDescription: global.mozRTCSessionDescription || global.webkitRTCSessionDescription ||
      global.RTCSessionDescription,
    RTCIceCandidate: global.mozRTCIceCandidate || global.webkitRTCIceCandidate ||
      global.RTCIceCandidate
  });
  imagedropper.init(document.querySelector('#message'), function (imgData) {
    peer.send(imgData, true);
  });
})(window);
