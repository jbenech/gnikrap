Gnikrap 
-------

Gnikrap is a simple and powerfull javascript development environment for the Lego Mindstrom EV3.

For more information, visit the [home page](http://jbenech.github.io/gnikrap)


#### Changelog

Gnikrap changelog is available [here](gnikrap-core/src/main/scripts/history.txt)


#### Contributing

You can contribute to Gnikrap in several way:
* Fixing or adding new translation, you can have a look to the files [here](gnikrap-core/src/main/WEB-CONTENT/locales).   
  There is basically a file 'translation.json' which contains all the translation for one language. This files has to be put 
  in a folder with the language code (eg. 'en' for english, 'fr' for french, 'es' fos spanish, 'zh' for chinese, ...).
* Fixing or adding some documentation, you can have a look to the files [here](gnikrap-doc/src/main/asciidoc).
* Hacking the code, see details on compiling below.

##### Compiling gnikrap

In order to compile Gnikrap, you will need: a JRE (1.7+) and Maven (3+).

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


#### License

Gnikrap is distributed under the GPL-v3 License. See [LICENSE](LICENSE) for further details.


#### Thank you!

We really appreciate all kind of feedback and contributions. Thanks for using and supporting Gnikrap!
