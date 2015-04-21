// The MIT License (MIT)
//
// Copyright (c) 2015 pangpangzhu
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

var express = require('express');
var async = require('async');
var Browser = require('zombie');
var fs = require('fs');
var http = require('http');

var router = express.Router();
var browser = new Browser();
var current_img = null;
var button = null;

browser.userAgent = 'Mozilla/5.0 (Linux; U; en-US) AppleWebKit/528.5+ (KHTML, like Gecko, Safari/528.5+) Version/4.0 Kindle/3.0 (screen 600×800; rotate)';

// This is the page on youyaoqi from where you want to start reading.
var starting_url = 'http://www.u17.com/chapter/342351.html';

var check_page = function (callback) {
  return function() {
    this.current_img =
      browser.document.getElementById('current_read_image')
        .getElementsByClassName('cur_img')[0];
    this.button =
      browser.document.getElementsByClassName('pagebar')[0]
        .getElementsByClassName('next')[0];
    return callback(this.current_img, this.button);
  }
};

async.series([
  function (done) {
    browser.visit(
      starting_url,
      check_page(
        function(img, button) {
          return
            typeof img != 'undefined' &&
            typeof button != 'undefined';
        }
      ),
      function () {
        console.log('[page loaded] ' + this.current_img.src);
        done();
      }
    );
  }
]);

router.get('/', function (req, res) {
  res.render(
    'index',
    {
      imgsrc: this.current_img.src,
    }
  );
  async.series([
    function (done) {
      browser.click(
        this.button,
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
            return img.className.indexOf('cur_img') == -1;
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
