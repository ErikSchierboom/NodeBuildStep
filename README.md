# NodeBuildStep

A sample application that shows how you can automatically restore node.js module dependencies and how to use node.js commands as a build step in a .NET application.

## Setup 
The chosen setup was adapted from the Peter Dolken's great [Integrating Node.JS, NPM and RequireJS into Visual Studio / MSBuild article](http://blog.ddrit.com/2013/11/integrating-node-js-npm-and-requirejs-into-visual-studio-msbuild/). I chose to adapt his solution slightly, to make it more easier to read and for cross-platform compatibility. His solution automatically downloads the `node.exe` file, but that ties the build to Windows environments and I needed it to work on Mono on Linux. Not automatically downloading node.js meant that my solution does have one prerequisite: 

* Node.js must be installed (see the [download node.js page](http://nodejs.org/download/) for instructions for each supported platform).

### Automatically restore node.js module dependencies

Once you have node.js installed, you can use the following steps to automatically restore node.js modules in your .NET application:

1. Create a **.node** directory in your solution's root directory and add a **node.targets** file to it with the following contents:

    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <Project ToolsVersion="4.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
        <PropertyGroup>
            <SolutionDir Condition="$(SolutionDir) == '' Or $(SolutionDir) == '*Undefined*'">$(MSBuildProjectDirectory)\..\</SolutionDir>
        
            <!-- Enable the restore command to run before builds -->
            <RestoreNodePackages Condition="  '$(RestoreNodePackages)' == '' ">true</RestoreNodePackages>

            <!-- Determines if package restore consent is required to restore packages -->
            <RequireRestoreConsent Condition=" '$(RequireRestoreConsent)' != 'false' ">true</RequireRestoreConsent>
        </PropertyGroup>
       
        <PropertyGroup>
            <!-- This command will run "npm install" to ensure that all the dependencies specified in the package.json file are installed -->
            <RestoreNodeCommand>npm install</RestoreNodeCommand>

            <!-- We need to ensure all Node packages are restored prior to assembly resolve -->
            <BuildDependsOn Condition="$(RestoreNodePackages) == 'true'">
                RestoreNodePackages;
                $(BuildDependsOn);
            </BuildDependsOn>
        </PropertyGroup>

        <!-- Define a build target that can be references from a project that will automatically  -->
        <Target Name="RestoreNodePackages">
            <!-- Execute the RestoreNodeCommand in the project's directory. As such, the package.json file needs to be in the root of the
                    project directory for the Node package restore to succeed -->
            <Exec Command="$(RestoreNodeCommand)" ContinueOnError="true" WorkingDirectory="$(ProjectDir)" />
        </Target>
    </Project>
    ```

    This file is a [MSBuild targets file](http://msdn.microsoft.com/en-us/library/ms164312.aspx), which can contain items, properties and tasks for common build scenarios. Our **node.targets** file adds a target named **RestoreNodePackages**, which simply executes the `npm install` command from your project's directory. As such, you will need to have your **package.json** file (which contains the node.js modules the project depends on) in your project's directory.

2. The second step is to use the **RestoreNodePackages** target in our project. To do that, edit the project's **.csproj** file. You can do this directly from the file system, our right-click on the project, select *Unload Project*, again right-click on the project and select *Edit &lt;project name&gt;.csproj*.

    In the **.csproj** file, go to the bottom of the file and add the following lines:

    ```xml
    <Import Project="$(SolutionDir)\.node\Node.targets" Condition="Exists('$(SolutionDir)\.node\Node.targets')" />
    <Target Name="BeforeBuild">
        <CallTarget Targets="RestoreNodePackages" />
    </Target>    
    ```

    The first line includes the **Node.targets** file, after which we are able to add the **RestoreNodePackages** target as a before-build step in the following lines. 

And now we are done! Whenever you'll build your project, the `npm install` command will be run, which parses your **package.json** file for its dependencies and install those dependencies.

### Using node.js commands in your build

If you have node.js installed, you can of course call node.js commands as part of your pre- or post build events. As an example on how the previous node module restore can enable some rather cool scenarios, we will use [Grunt](http://gruntjs.com/) to combine and minify our JavaScript and CSS each time we build our project. The following steps show how to do this:

1. Open up a console and go to the project directory.

2. If you did not already have a **package.json**, run `npm init` to create one.

3. Add the `Grunt` module and some of its extension modules as node.js dependencies using the following commands:

    1. `npm install grunt --save-dev`
    2. `npm install grunt-cli --save-dev`
    3. `npm install grunt-contrib-uglify --save-dev`
    4. `npm install grunt-contrib-cssmin --save-dev`

    These commands will install dependencies in our **package.json** file, which now should have a **devDependencies** section that looks like this:

    ```json 
    "devDependencies": {
        "grunt": "~0.4.x",
        "grunt-cli": "~0.1.x",
        "grunt-contrib-uglify": "~0.4.x",
        "grunt-contrib-cssmin": "~0.9.x"
    }
    ```

4. Create a **GruntFile.js** file in your project directory with the following contents:

    ```javascript 
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
    ``` 

    This grunt file registers two tasks: **uglify** and **cssmin**, which combine and minify JavaScript respectively CSS source files. For more information on how to configure and use Grunt, see this [getting started guide](http://gruntjs.com/getting-started).

5. Now when you run the `grunt` command, the **uglify** and **cssmin** tasks will be executed and a **Scripts/build.min.js** and **Content/build.min.css** will be built.

6. We can call this `grunt` command automatically at each build by simply adding it as a post-build event. To do so, right-click on the project and select *Properties*. Then go to the *Build Events* tab and enter the text **"grunt"** (without the quotes) in the *Post-build event command line* section and save the changes.

7. Now rebuild the project and the `grunt` command will automatically be executed as a post-build step.

We have now shown how to automatically restore node.js modules and how to call node.js commands as a build step.

## License
[Apache License 2.0](LICENSE)