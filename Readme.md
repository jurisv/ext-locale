# About 

Ext-locale package provides mechanism for lightweight localisation using predefined dictionary object. 

It fully supports dynamic package loader and provides property replacement within class at any given level. Additionally it can be used within XTemplate and ensures tight integration with view bindings.

Current Version 2.5.0 compatibility:

Ext JS 6.5.0+ 

Sencha CMD 6.5+

*Requires dynamic package loader.

*For older versions try 'old' code branch instead.


### Example 1 - Simple string
Field label will be replaced with firstName content from dictionary

Two formats are supported - String and object

#### String format
```javascript
{
   xtype: 'textfield',
   fieldLabel: '~firstName',
   name: 'firstName'
}
```

#### Namespaced (nested)
```javascript
{
   xtype: 'panel',
   html: '~content.dummy'
}
```

#### Foreign package
Separate package name from variable via pipe. To access variables from main app, use the app name as package
For example if your app has name 'Sample', then string would look like this: html: '^Sample|home'

```javascript
{
   xtype: 'checkbox',
   html: '~common|yes'
}
```

### Example 2 - Object format
_**Important: We are using property named '$key' to identify objects that require localization.**_
```javascript
{
   xtype: 'textfield',
   fieldLabel: {$key: 'firstName'},
   name: 'firstName'
}
```
Text will be replaced using template tpl and content of lastNameLabel will be applied to placeholder {0}
Optionally you can specify foreign package
```javascript
{
   dataIndex: 'lastName',
   text: {$key: 'lastNameLabel', tpl: '{0} Name', pkg: 'common'}
}
```

### Example 3
Support within bindings
```javascript
{
   xtype: 'panel',
   bind: {
       title: {$key: 'showTimesFor', tpl:'{0} {movieName}'}
   }
}
```

Assuming that 'showTimesFor' has string 'Show times for:' after localization object will look as follows
Note: movieName will come from your viewModel data.
```javascript
{
   xtype: 'panel',
   bind: {
       title: 'Show times for: {movieName}'
   }
}
```

If the key is not found, in development mode, message like this will be displayed in the console:
```
Missing localization for "title" with value "~title3" in dictionary for package: test1
```
'title' property will remain untranslated and carry value "~title3"

### Example 4
Direct access to dictionary
```javascript
Localize.Base.lookup('navigation.users', 'Sample');
```


#
### Payload examples

locale-en-US.json
```json
{
  "title": "User registration panel",
  "title2": "Something great",
  "content": {
    "dummy": "Content goes here"
  }
}
```

locale-es-ES.json

```json
{
  "title": "Panel de registro de usuario",
  "content": {
    "dummy": "El contenido va aquí"
  }
}
```


#
### Installation and Config

1) Add this package to your local packages folder
2) In app.json build profile add localize package as requirement, e.g. 

```json
"builds": {
        "classic": {
            "toolkit": "classic",
            
            "theme": "theme-triton",
            "requires": [
                "localize",
                "test1",
                "test2"
            ],
            "sass": {
                "generated": {
                    "var": "classic/sass/save.scss",
                    "src": "classic/sass/save"
                }
            }
        }
    },
```

We also add custom property "productionMode" and set it to true. This will be visible only in production build and used later to turn off any debugging.
If you have the production section within build profiles, make sure that you place that variable within same location ('production' object)
```json
/**
     * Settings specific to production builds.
     */
    "production": {
        "output": {
            "appCache": {
                "enable": false,
                "path": "cache.appcache"
            }
        },
        "loader": {
            "cache": "${build.timestamp}"
        },
        "cache": {
            "enable": true
        },
        "compressor": {
            "type": "yui"
        },
        "productionMode": true
    },
```


3) In every package that should be localized add the following config to the package.json
```json
 /**
    *
    * Enable localization support for this package
    *
    *  "localize" : true
    *
    */
    "localize": true
```

4) In your index file we have to provide some hints that we would like to take advantage of this localization package
Example index.html script block
```javascript
        var Ext = Ext || {}; // Ext namespace won't be defined yet...

        Ext.beforeLoad = function (tags) {
            var profile,
                    lang,
                    obj = location.search.substring(1).split("&").reduce(function (prev, curr) {
                        var p = curr.split("=");
                        prev[decodeURIComponent(p[0])] = p[1] === undefined ? '' : decodeURIComponent(p[1]);
                        return prev;
                    }, {});

            if (obj.classic) {
                profile = 'classic';
            }
            else if (obj.modern) {
                profile = 'modern';
            }
            else {
                profile = tags.desktop ? 'classic' : 'modern';
                //profile = tags.phone ? 'modern' : 'classic';
            }

            Ext.manifest = profile; // this name must match a build profile name

            // Example auto detection
            // Priority:
            // overridden language - parameter: lang
            // browser auto detection
            // Fallback to 'en-US'

            lang = obj.lang || navigator.language || navigator.browserLanguage || navigator.userLanguage || 'en-US';

            // Ensure we have the uppercase 'script' part if only language is defined
            if (lang.length === 2) {
                lang = lang === 'en' ? 'en-US' : lang + '-' + lang.toUpperCase();
            }

            // This function is called once the manifest is available but before
            // any data is pulled from it.
            //
            return function (manifest) {
                manifest.content.localize = {
                    //detected or overridden language
                    language: lang,

                    // Url Tpl to use when construction resource PATH name
                    // For american english resource URL will be defined as 'data/locale-en-US.json'
                    urlTpl: 'data/locale-{0}.json',

                    // If true will attempt to load locale resources from each defined package
                    // To signify if package has to be localized, add the following line to the package.json
                    // "localize": true,
                    // Localizing strings per package has it's own benefits, as you don't have to include any prefixes or other mechanisms.
                    // All Strings will be resolved only within it's own package
                    // You can access localizations from main application via foreign package notation appName|variableName
                    usePackages: true,
                    // All but production builds will have useful warnings/ debug information
                    debug: !manifest.content.productionMode,
                    dynamic: true //Starting from CMD 6.5 we have dynamic package loader. If enabled, it will load only active package localizations
                };
            };
        };

```

5) In Applciation.js require the Localization Base class. It should be the required after any Ext classes, but before your own packages
```javascript
Ext.define('Sample.Application', {
    extend: 'Ext.app.Application',

    name: 'Sample',

    requires: [
        'Localize.Base',

        'Test1.*',
        'Sample.nested.*'
    ],
...
```

6) IMPORTANT! Disable Sencha CMD production build optimization for 'define' method. In file .sencha/production.properties add the following line
```javascript
build.optimize.defines=
```
For latest versions of CMD if you no longer have .sencha folder in your project, you have to add this setting to the output section like this
```json
"js": {
      "optimize": {
        "defines": false,
        "callParent": true,
        "requires": true,
    }
```

#
### Example project

Example project can be found here:
https://github.com/jurisv/Localize


### Future development

As this is fundamental requirement for the most Enterprise applications, we are currently experimenting with the idea of providing replacement core class/Boot files.

#### The MIT License (MIT)
Copyright (c) 2016-2018 Juris Vecvanags

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
