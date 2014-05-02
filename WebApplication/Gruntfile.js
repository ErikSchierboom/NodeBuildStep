module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // Specify what the uglify task should do. In our case, we will combine the JavaScript files the website depends on
        // into a single, minified JavaScript file
        uglify: {
            base: {
                files: {
                    'Scripts/build.min.js': ['Scripts/jquery-1.10.2.js', 'Scripts/bootstrap.js', 'Scripts/respond.js', 'Scripts/site.js']
                }
            }
        },

        // Specify what the CSS minify task should do. In our case, we will combine the CSS files the website depends on
        // into a single, minified CSS file
        cssmin: {
            base: {
                files: {
                    'Content/build.min.css': ['Content/bootstrap.css', 'Content/site.css']
                }
            }
        }
    });

    // Load the plugins that provides the "uglify" task and "cssmin" tasks
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    // Register the default task, which is called when the user runs "grunt" on the command line
    // in the same directory and this grunt file is located. When this task runs, it will combine 
    // and minify both the JavaScript and the CSS
    grunt.registerTask('default', ['uglify', 'cssmin']);
};