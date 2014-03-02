var passport = require('passport');
var _ = require('underscore');
var validator = require('validator');

var Imager = require('imager');
var imagerConfig = require('../config/imager.js');
var imager = new Imager(imagerConfig, 'Local');

var redisTag   = require("redis-tag");
var bookTagger = new redisTag.Taggable("book");
var Book = require('../models/Book');

/**
 * Get All books
 */

var getBooksAndRender = function(req, res, options) {
  var perPage = 6;
  var perRow = 3;
  var page = req.param('page') > 1 ? req.param('page') : 1;

  var searchParams = {};

  // Options could signify search results
  if(options && options.ids) {
    searchParams._id = options.ids;
  }
  options = _.defaults(options, {
    title: 'Books',
    pageTitle: 'Books in the Library',
    renderView: 'book/all'
  });

  Book
    .find(searchParams)
    .limit(perPage)
    .skip(perPage * (page - 1))
    .sort({ _id: 'desc' })
    .exec(function(err, books) {
      // Redis done first
      // Must be a better way
      _.each(books, function(book) {
        bookTagger.get(book._id, function(tags) {
          book.tags = tags;
        });
      });

      Book.find(searchParams).count().exec(function(err, count) {
        res.render(options.renderView, {
          title: options.title,
          pageTitle: options.pageTitle,
          books: _.toArray(_.groupBy(books, function(item, index){
                    return Math.floor(index / perRow);
                  })),
          page: page,
          pages: Math.ceil(count / perPage)
        });
      });
    });
};

exports.getBooks = getBooksAndRender;

exports.getBook = function(req, res) {
  var bookTags = [];
  bookTagger.get(req.params.id, function(tags) {
    bookTags = tags;
  });

  Book.findOne({ '_id': req.params.id }).exec(function(err, book) {
    if(err) {
      res.status(404);
      res.render('404');
    } else {
      res.render('book/show', {
        title: 'Details for ' + book.name,
        book: book,
        tags: bookTags
      });
    }
  });
};

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
        // Set tags in redis
        var tags = req.body.tags;
        if(tags) {
          // Split
          // Compact for empty stuff
          // Then remove trailing and leading white spaces
          tags = _.compact(tags.split(','))
                  .map(function(tag) {
                    return tag.replace(/^\s+|\s+$/g, '');
                  });
          if(!_.isEmpty(tags)) {
            bookTagger.set(book._id, tags, function(response){
              console.log('Saved tags for Book', book._id, 'and tags', tags);
            });
          }
        }

        req.flash('success', { msg: 'Book Added!' });
      }

      getBooksAndRender(req, res);
    });
  }, 'book');
};

exports.searchBook = function(req, res) {
  var query = validator.escape(req.query.q);

  bookTagger.find([ query ], function(ids) {
    getBooksAndRender(req, res, {
      ids: ids,
      pageTitle: 'Search Results for ' + query,
      title: 'Search results'
    });
  });
};
