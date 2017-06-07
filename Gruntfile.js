/*global module:false*/

const fs = require('fs');
const util = require('util');

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);
  
  grunt.registerMultiTask('generate-config', 'Generates config.js', function() {
    const config = this.data.options.config;
    
    const values = {
      server: config.server
    };
    
    fs.writeFileSync(this.data.options.output, util.format('function getConfig() { return %s; };', JSON.stringify(values)));
    
    return true;
  });
  
  grunt.initConfig({
    'sass': {
      dist: {
        options: {
          style: 'compressed'
        },
        files: [{
          expand: true,
          cwd: 'src/scss',
          src: ['*.scss'],
          dest: 'www/css',
          ext: '.min.css'
        }]
      }
    },
    'pug': {
      compile: {
        options: {
          data: function(dest, src) {
            return require('./config.json');
          }
        },
        files: [{
          expand: true,
          cwd: 'src/templates',
          src: ['*.pug'],
          dest: 'www',
          ext: '.html'
        }]
      }
    },
    'generate-config': {
      'generate': {
        'options': {
          'config': require('./config.json'),
          'output': 'www/js/config.js'
        }
      }
    },
    'babel': {
      options: {
        sourceMap: true,
        minified: false
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'src/js',
          src: ['*.js'],
          dest: 'www/js/',
          ext: '.js'
        }]
      }
    },
    wiredep: {
      target: {
        src: 'www/index.html' // point to your HTML file.
      }
    }
  });
  
  grunt.registerTask('default', [ 'sass', 'pug', 'generate-config', 'babel', 'wiredep' ]);
};