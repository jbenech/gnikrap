#### Contributing

You can contribute to Gnikrap in several way:
* Fixing or adding new translation, you can have a look to the files [here](gnikrap-core/src/main/webapp/locales).   
  There is basically a file 'translation.json' which contains all the translation for one language. This files has to be put 
  in a folder with the language code (eg. 'en' for english, 'fr' for french, 'es' fos spanish, 'zh' for chinese, ...).
* Fixing or adding some documentation, you can have a look to the files [here](gnikrap-doc/src/main/asciidoc).
* Hacking the code, see details on building below.

##### Building gnikrap

In order to build Gnikrap, you will need: 
* an JDK (1.7+) - See [Oracle JDK download page](http://www.oracle.com/technetwork/java/javase/downloads/index.html)
* Maven (3+) - See [Apache Maven download page](http://maven.apache.org/download.cgi)
* Optionally for generating the Windows 'Installer', you need InnoSetup (5+ unicode) 
  * InnoSetup can be downloaded [here](http://www.jrsoftware.org/isdl.php) 
  * The path of the iscc.exe command can be setup in the `/pom.xml` file (`InnoSetupCompiler` property)


In the dependencies, the leJOS library need to be pushed manually to your local repository (currently not available on public repositories): 

```XML
  <groupId>lejos</groupId>
  <artifactId>ev3classes</artifactId>
  <version>0.9.0-beta</version>
```

You can use a command like this one:
```cmd
mvn install:install-file -Dfile=ev3classes.jar -DgroupId=lejos -DartifactId=ev3classes -Dversion=0.9.0-beta -Dpackaging=jar -Dsources=ev3classes-src.zip
```
