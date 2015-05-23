// Creates a websocket server and establishes a PeerConnection for every client that connects.
// Going through the usual offer, answer ice candidate process.

var ws = require('ws');
var webrtc = require('wrtc');
var dataChannels = require('./datachannels.js');

module.exports = function (host, socketPort) {
  var wss = new ws.Server({
      'port': socketPort
    });

  wss.on('connection', function(socket) {
    var pc = null,
      offer = null,
      answer = null,
      remoteReceived = false,
      pendingCandidates = [];

    console.info('socket connected');

    function doHandleError(error) {
      throw error;
    }

    function doCreateAnswer() {
      remoteReceived = true;
      pendingCandidates.forEach(function(candidate) {
        if (candidate.sdp) {
          pc.addIceCandidate(new webrtc.RTCIceCandidate(candidate.sdp));
        }
      });
      pc.createAnswer(
        doSetLocalDesc,
        doHandleError
      );
    }

    function doSetLocalDesc(desc) {
      answer = desc;
      console.info(desc);
      pc.setLocalDescription(
        desc,
        doSendAnswer,
        doHandleError
      );
    }

    function doSendAnswer() {
      socket.send(JSON.stringify(answer));
      console.log('awaiting data channels');
    }

    function doSetRemoteDesc() {
      console.info(offer);
      pc.setRemoteDescription(
        offer,
        doCreateAnswer,
        doHandleError
      );
    }

    socket.on('message', function(data) {
      data = JSON.parse(data);
      if ('offer' == data.type) {
        offer = new webrtc.RTCSessionDescription(data);
        answer = null;
        remoteReceived = false;

        pc = new webrtc.RTCPeerConnection({
          iceServers: [{
            url: 'stun:stun.l.google.com:19302'
          }]
        }, {
          'optional': [{
            DtlsSrtpKeyAgreement: false
          }]
        });
        pc.onsignalingstatechange = function(state) {
          console.info('signaling state change:', state);
        };
        pc.oniceconnectionstatechange = function(state) {
          console.info('ice connection state change:', state);
        };
        pc.onicegatheringstatechange = function(state) {
          console.info('ice gathering state change:', state);
        };
        pc.onicecandidate = function(candidate) {
          socket.send(JSON.stringify({
            type: 'ice',
            sdp: {
              candidate: candidate.candidate,
              sdpMid: candidate.sdpMid,
              sdpMLineIndex: candidate.sdpMLineIndex
            }
          }));
        };

        dataChannels.add(pc);
        doSetRemoteDesc();
      } else if ('ice' == data.type) {
        if (remoteReceived) {
          if (data.sdp.candidate) {
            pc.addIceCandidate(new webrtc.RTCIceCandidate(data.sdp.candidate));
          }
        } else {
          pendingCandidates.push(data);
        }
      }
    });
  });
};