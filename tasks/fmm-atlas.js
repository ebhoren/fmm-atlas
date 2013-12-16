'use strict';

module.exports = function(grunt) {

  var path        = require('path'),
      exec        = require('child_process').exec,
      nodeatf     = require('node-atf');

  return grunt.registerMultiTask('fmm-atlas', 'Make Fort McMoney atlas.', function() {

    var ATF_DESKTOP  = 'desktop',
        ATF_IOS      = 'ios';

    var done        = this.async();
    var options     = this.options({
          output: null,
          retina: false,
          atf: null
        });






    // utility methods
    var atf = function( filepath, dest, callback ){

      var commands = [];

      if( options.atf == ATF_DESKTOP ) commands.push('-c d');
      else if( options.atf == ATF_IOS )
      {
        commands.push('-c p');
        //commands.push('-e');
      }
      else
      {
        commands.push('-c');
        //commands.push('-e');
      };

      commands.push('-r');

      nodeatf.png2atf( filepath, dest, commands.join(' '), function(error, stdout, stderr){

        if( error ) grunt.fail.warn('Error during texture\'s encoding at: ' + filepath);
        callback( dest );
      });
    };

    var pack = function( src, output, atlas, callback ){

      var commands = ['TexturePacker'];
          commands.push('--sheet', output);
          commands.push('--data', atlas);
          commands.push('--scale', options.retina === true ? '1.0' : '0.5' );
          commands.push('--format', 'sparrow');
          commands.push('--pack-mode', 'Best');
          commands.push('--force-publish');
          commands.push('--scale-mode', 'Smooth');
          commands.push('--algorithm', 'MaxRects');
          commands.push('--maxrects-heuristics', 'Best');
          commands.push('--trim-mode', 'None');
          commands.push('--disable-rotation');
          commands.push('--border-padding', 0);

          if( options.atf !== null )
          {
            commands.push('--shape-padding', 2);
            commands.push('--size-constraints', 'POT');
            commands.push('--force-squared');
            commands.push('--max-size', options.retina === true ? 2048 : 1024 );
          }
          else
          {
            commands.push('--shape-padding', 0);
            commands.push('--size-constraints', 'AnySize');
          };

          commands.push( src );

      exec(commands.join(' '), function(error, stdout, stderr){ if( stderr ) grunt.log.writeln(stderr); callback(); });
    };

    var clean = function( dir, callback ){ grunt.file.delete( dir ); callback() };




    // create a new files array because grunt's one really sucks!!!
    var files = [];
    this.data.files.forEach(function( file ){ files.push({src: file.src[0], output: file.output, atlas: file.atlas}); });



    // process each files
    grunt.util.async.forEachSeries(files, function( file, next ){

      grunt.log.writeln('Creating spritesheet:', options.output + file.output);

        var src             = path.dirname(file.src),
            extension       = path.extname(file.output),
            texture         = path.dirname(file.output) + '/' + path.basename(file.output, extension) + ( options.retina === true ? '@2x' : '' ) + extension,
            atlas           = path.dirname(file.atlas) + '/' + path.basename(file.atlas, '.xml') + ( options.retina === true ? '@2x' : '' ) + '.xml';

      if( options.atf !== null )
      {
        // create temporary directory
        var tmp = src + '/tmp/';
        grunt.file.mkdir( tmp );

        // pack texture
        pack( file.src, tmp + texture, options.output + atlas, function(){

          // compress to ATF format
          atf( tmp + texture, options.output + texture, function(){ clean( tmp, next ); });

        });
      }
      else
      {
        pack( file.src, options.output + texture, options.output + atlas, next );
      };

    }, done);





  });
};