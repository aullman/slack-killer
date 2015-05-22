(function() {
  var dataChannel,
    dataChannelConnected,
    bufferedMessages = [],
    userName;
  exports.initialise = function(opts) {
    userName = opts.name;
    var host = opts.host || window.location.host.split(':')[0],
      bridge = host + ':9001',
      RTCPeerConnection = opts.RTCPeerConnection,
      RTCSessionDescription = opts.RTCSessionDescription,
      RTCIceCandidate = opts.RTCIceCandidate,
      pendingCandidates = [];

    function doHandleError(error) {
      throw error;
    }

    function doComplete() {
      console.log('complete');
      dataChannelConnected = true;
      bufferedMessages.forEach(function (message) {
        dataChannel.send(message);
      });
      bufferedMessages = [];
    }

    function doWaitforDataChannels() {
      console.log('awaiting data channels');
    }

    var ws = null;
    var pc = new RTCPeerConnection({
      iceServers: [{
        url: 'stun:stun.l.google.com:19302'
      }]
    }, {
      'optional': []
    });
    pc.onsignalingstatechange = function(event) {
      console.info("signaling state change: ", event.target.signalingState);
    };
    pc.oniceconnectionstatechange = function(event) {
      console.info("ice connection state change: ", event.target.iceConnectionState);
    };
    pc.onicegatheringstatechange = function(event) {
      console.info("ice gathering state change: ", event.target.iceGatheringState);
    };
    pc.onicecandidate = function(event) {
      var candidate = event.candidate;
      if (!candidate) return;
      if (WebSocket.OPEN == ws.readyState) {
        ws.send(JSON.stringify({
          'type': 'ice',
          'sdp': {
            'candidate': candidate.candidate,
            'sdpMid': candidate.sdpMid,
            'sdpMLineIndex': candidate.sdpMLineIndex
          }
        }));
      } else {
        pendingCandidates.push(candidate);
      }
    };

    doCreateDataChannels();

    var $messages = document.querySelector('#messages');

    function doCreateDataChannels() {
      dataChannel = pc.createDataChannel('reliable', {
        ordered: false,
        maxRetransmits: 10
      });
      dataChannel.binaryType = 'arraybuffer';
      dataChannel.onopen = doComplete;
      dataChannel.onmessage = function(event) {
        if ('string' == typeof event.data) {
          var msg = JSON.parse(event.data);
          console.log('onmessage:', data);
          var message = document.createElement('li');
          message.innerHTML = '<strong>' + msg.name + '</strong>: ' + msg.text;
          $messages.appendChild(message);
        } else {
          console.log('onmessage:', new Uint8Array(data));
        }
      };
      dataChannel.onclose = function(event) {
        console.info('onclose');
      };
      dataChannel.onerror = doHandleError;
      doCreateOffer();
    }

    function doCreateOffer() {
      pc.createOffer(
        doSetLocalDesc,
        doHandleError
      );
    }

    function doSetLocalDesc(desc) {
      pc.setLocalDescription(
        new RTCSessionDescription(desc),
        doSendOffer.bind(undefined, desc),
        doHandleError
      );
    }

    function doSendOffer(offer) {
      ws = new WebSocket("ws://" + bridge);
      ws.onopen = function() {
        pendingCandidates.forEach(function(candidate) {
          ws.send(JSON.stringify({
            type: 'ice',
            sdp: {
              candidate: candidate.candidate,
              sdpMid: candidate.sdpMid,
              sdpMLineIndex: candidate.sdpMLineIndex
            }
          }));
        });
        ws.send(JSON.stringify({
          type: offer.type,
          sdp: offer.sdp
        }));
      };
      ws.onmessage = function(event) {
        data = JSON.parse(event.data);
        if ('answer' == data.type) {
          doSetRemoteDesc(data);
        } else if ('ice' == data.type) {
          if (data.sdp.candidate) {
            var candidate = new RTCIceCandidate(data.sdp.candidate);
            pc.addIceCandidate(candidate);
          }
        }
      };
    }

    function doSetRemoteDesc(desc) {
      pc.setRemoteDescription(
        new RTCSessionDescription(desc),
        doWaitforDataChannels,
        doHandleError
      );
    }
  };

  exports.send = function(text) {
    var msg = JSON.stringify({
      name: userName,
      text: text
    });
    if (!dataChannelConnected) {
      bufferedMessages.push(msg);
    } else {
      dataChannel.send(msg);
    }
  };
})();
