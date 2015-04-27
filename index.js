var express = require('express');
var async = require('async');
var Browser = require('zombie');
var fs = require('fs');
var http = require('http');

var router = express.Router();
var browser = new Browser();

browser.userAgent = 'Mozilla/5.0 (Linux; U; en-US) AppleWebKit/528.5+ (KHTML, like Gecko, Safari/528.5+) Version/4.0 Kindle/3.0 (screen 600×800; rotate)';

// This is the page on youyaoqi from where you want to start reading.
var starting_url = 'http://www.u17.com/chapter/353815.html';

var check_page = function (callback) {
  return function() {
    var new_img =
      browser.document.getElementById('current_read_image')
        .getElementsByClassName('cur_img')[0];
    this.button_next =
      browser.document.getElementsByClassName('pagebar')[0]
        .getElementsByClassName('next')[0];
    this.button_prev =
      browser.document.getElementsByClassName('pagebar')[0]
        .getElementsByClassName('prev')[0];
    return callback(new_img);
  }
};

browser.visit(
  starting_url,
  check_page(
    function(img) {
      if (typeof img !== 'undefined') {
        this.current_img = img;
        this.all_imgs = [];
        return true;
      }
      return false;
    }
  ),
  function () {
    console.log('[page loaded] ' + this.current_img.src);
  }
);

router.get('/', function (req, res) {
  if (typeof req.query.button == 'undefined') {
    req.query.button = 'next';
  }

  if (req.query.button == 'next') {
    if (this.prev_img) {
      this.all_imgs.push(this.prev_img);
    }
    this.prev_img = this.current_img.src;
  } else {
    this.prev_img = this.all_imgs.pop();
  }

  res.render(
    'index',
    { imgsrc: req.query.button == 'prev' ? this.prev_img : this.current_img.src }
  );

  async.series([
    function (done) {
      browser.click(
        req.query.button == 'prev' ? this.button_prev : this.button_next,
        function (e) {
          if (e) { console.log('[browser error] ' + e); }
          done();
        }
      );
    },
    function (done) {
      browser.wait(
        check_page(
          function (img) {
            if (img && img.src != this.current_img.src) {
              this.current_img = img;
              return true;
            }
            return false;
          }
        ),
        function (e) {
          if (e) { console.log('[browser error] ' + e); }
          console.log('[page loaded] ' + this.current_img.src);
          done();
        }
      );
    }
  ]);
});

module.exports = router;
