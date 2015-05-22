var peer = require('./peer.js'),
  $messageInput = document.querySelector('#message'),
  $messageForm = document.querySelector('#messageForm');

$messageForm.addEventListener('submit', function (event) {
  event.preventDefault();
  var msg = $messageInput.value;
  $messageInput.value = '';
  peer.send(msg);
});