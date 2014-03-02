var mongoose = require('mongoose');
var imagerConfig = require('../config/imager.js');

var convertToPublicPath = function(path) {
  return imagerConfig.storage.Local.path.replace('public', '') + 'mini_' + path;
};

var bookSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  author: { type: String, required: true, index: true },
  publisher: { type: String, required: true, index: true },
  picture: { type: String, default: '' },
  edition: { type: String },
  year: { type: Number, min: 1990, max: 2050 },
  creator: mongoose.Schema.ObjectId
});

// Paths for Images are virtual
//
var resizeImagePath = function(object, type) {
  return imagerConfig.storage.Local.path.replace('public', '') + type + object.picture;
};

bookSchema
.virtual('mini_picture')
.get(function () {
  return resizeImagePath(this, 'mini_');
});

bookSchema
.virtual('thumb_picture')
.get(function () {
  return resizeImagePath(this, 'thumb_');
});

module.exports = mongoose.model('Book', bookSchema);
