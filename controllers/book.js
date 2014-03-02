var passport = require('passport');
var _ = require('underscore');
var Imager = require('imager');
var imagerConfig = require('../config/imager.js');
var imager = new Imager(imagerConfig, 'Local');
var Book = require('../models/Book');

/**
 * Get All books
 */

var getAllBooksAndRender = function(req, res) {
  var perPage = 3,
      page = req.param('page') > 1 ? req.param('page') : 1;

  Book
    .find()
    .limit(perPage)
    .skip(perPage * (page - 1))
    .sort({ _id: 'desc' })
    .exec(function(err, books) {
      Book.count().exec(function(err, count) {
        res.render('book/all', {
          title: 'Books',
          books: _.toArray(_.groupBy(books, function(item, index){
                    return Math.floor(index / perPage);
                  })),
          page: page,
          pages: Math.ceil(count / perPage)
        });
      });
    });
};

exports.getBooks = getAllBooksAndRender;

exports.postAddBook = function(req, res) {
  var book = new Book({
    name: req.body.name,
    author: req.body.author,
    publisher: req.body.publisher,
    edition: req.body.edition,
    year: req.body.year,
    creator: req.user
  });

  imager.upload([req.files.picture], function(err, cdnUri, files) {
    // Seems like the array gets hold of all the files uploaded
    // We only need the last image!
    var currentFile = _.last(files);
    book.picture = currentFile;

    book.save(function(err) {
      if(err) {
        imager.remove([ currentFile ], function (err) {
          // Just Remove
        }, 'items');
        req.flash('errors', { msg: 'Failed Addition. Try again!' });
      } else {
        req.flash('success', { msg: 'Book Added!' });
      }

      getAllBooksAndRender(req, res);
    });
  }, 'book');

};
