var peer = require('./peer.js'),
  form = require('./messageform.js');
document.addEventListener('deviceready', function () {
  var name,
    iOS = window.device && window.device.platform === 'iOS';
  while (!name) {
    name = prompt('Please enter your name');
  }
  peer.initialise({
    name: name,
    host: 'adam.local',
    RTCPeerConnection: iOS ? cordova.plugins.iosrtc.RTCPeerConnection : window.webkitRTCPeerConnection,
    RTCSessionDescription: iOS ? cordova.plugins.iosrtc.RTCSessionDescription : window.RTCSessionDescription,
    RTCIceCandidate: iOS ? cordova.plugins.iosrtc.RTCIceCandidate : window.RTCIceCandidate
  });
}, false);