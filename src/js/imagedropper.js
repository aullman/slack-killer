module.exports = {
  init: function (drop, ondrop) {
    drop.addEventListener('drop', function (event) {
      event.preventDefault();

      var dt = event.dataTransfer,
        files = dt.files,
        file,
        reader;
      Array.prototype.forEach.call(files, function (file) {
        reader = new FileReader();

        reader.addEventListener('loadend', function (event) {
          ondrop(event.target.result);
        });

        reader.readAsDataURL(file);
      });
      return false;
    });
  }
};