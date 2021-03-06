'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    eslint: {
      target: ['client/scripts/*.js', 'client/scripts/**/*.js']
    },
    concat: {
      scripts: {
        src: ['client/scripts/main.js', 'client/scripts/**/*.js'],
        dest: 'dest/build/scripts/main.js'
      }
    },
    jade: {
      options: {
        pretty: true
      },
      source: {
        expand: true,
        cwd: 'client/pug',
        src: '**/**/!(_)*.pug',
        dest: 'dest/build',
        ext: '.html'
      }
    },
    less: {
      files: {
        src: 'client/less/main.less',
        dest: 'dest/build/styles/main.css'
      }
    },
    copy: {
      res: {
        expand: true,
        src: ['res/*'],
        cwd: 'client/',
        dest: 'dest/build'
      }
    },
    watch: {
      default: {
        tasks: ['eslint', 'jade', 'less', 'copy', 'concat'],
        files: ['client/**/*']
      }
    }
  });

  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('build', ['eslint', 'jade', 'less', 'copy', 'concat']);
};