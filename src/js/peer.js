(function() {
  var dataChannel,
    dataChannelConnected,
    bufferedMessages = [],
    userName;
  exports.init = function(opts) {
    userName = opts.name;
    var host = opts.host || window.location.host.split(':')[0],
      bridge = host + ':9001',
      RTCPeerConnection = opts.RTCPeerConnection,
      RTCSessionDescription = opts.RTCSessionDescription,
      RTCIceCandidate = opts.RTCIceCandidate,
      pendingCandidates = [],
      ws,
      pc,
      $messages = document.querySelector('#messages');

    function handleError(error) {
      throw error;
    }

    function createPeerConnection() {
      pc = new RTCPeerConnection({
        iceServers: [{
          url: 'stun:stun.l.google.com:19302'
        }]
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
      createDataChannels();
    }
    createPeerConnection();

    function createDataChannels() {
      dataChannel = pc.createDataChannel('reliable', {
        ordered: true,
        maxRetransmits: 10
      });
      dataChannel.binaryType = 'arraybuffer';
      dataChannel.onopen = function() {
        console.log('complete');
        ws.close();
        dataChannelConnected = true;
        bufferedMessages.forEach(function(message) {
          dataChannel.send(message);
        });
        bufferedMessages = [];
      };

      dataChannel.onmessage = function(event) {
        if ('string' == typeof event.data) {
          var msg = JSON.parse(event.data),
            msgEl = document.createElement('li');
          msgEl.innerHTML = '<strong>' + msg.name + '</strong>: ';
          if (msg.type === 'image') {
            console.log('onimage');
            var img = document.createElement('img');
            img.src = msg.text;
            msgEl.appendChild(img);
          } else {
            console.log('onmessage:', msg.text);
            msgEl.innerHTML += msg.text;
          }
          $messages.appendChild(msgEl);
        } else {
          console.log('onmessage:', new Uint8Array(data));
        }
      };
      dataChannel.onclose = function(event) {
        console.info('onclose');
      };
      dataChannel.onerror = handleError;
      createOffer();
    }

    function createOffer() {
      pc.createOffer(
        setLocalDesc,
        handleError
      );
    }

    function setLocalDesc(desc) {
      pc.setLocalDescription(
        new RTCSessionDescription(desc),
        sendOffer.bind(undefined, desc),
        handleError
      );
    }

    function sendOffer(offer) {
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
          setRemoteDesc(data);
        } else if ('ice' == data.type) {
          if (data.sdp.candidate) {
            var candidate = new RTCIceCandidate(data.sdp.candidate);
            pc.addIceCandidate(candidate);
          }
        }
      };
    }

    function setRemoteDesc(desc) {
      pc.setRemoteDescription(
        new RTCSessionDescription(desc),
        function () {
          console.log('awaiting data channels');
        },
        handleError
      );
    }
  };

  exports.send = function(text, img) {
    var msg = JSON.stringify({
      name: userName,
      type: img ? 'image' : 'text',
      text: text
    });
    if (!dataChannelConnected) {
      bufferedMessages.push(msg);
    } else {
      dataChannel.send(msg);
    }
  };
})();
