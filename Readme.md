###Provides mechanism for lightweight localisation using Predefined dictionary object

Compatibility:
Ext JS 6EA +



####Example 1 - Simple string
Field label will be replaced with firstName content from dictionary

Two formats are supported - String and object

####String format
```
{
   xtype: 'textfield',
   fieldLabel: '^firstName',
   name: 'firstName'
}
```

####Namespaced (nested)
```
{
   xtype: 'panel',
   html: '^content.dummy'
}
```

####Foreign package
Separate package name from variable via pipe. To access variables from main app, use the app name as package
For example if your app has name 'Sample', then string would look like this: html: '^Sample|home'

```
{
   xtype: 'checkbox',
   html: '^common|yes'
}
```

###Example 2 - Object format
_**Important: We are using property named '$key' to identify objects that require localization.**_
```
{
   xtype: 'textfield',
   fieldLabel: {$key: 'firstName'},
   name: 'firstName'
}
```
Text will be replaced using template tpl and content of lastNameLabel will be applied to placeholder {0}
Optionally you can specify foreign package
```
{
   dataIndex: 'lastName',
   text: {$key: 'lastNameLabel', tpl: '{0} Name', pkg: 'common'}
}
```

###Example 3
Support within bindings
```
{
   xtype: 'panel',
   bind: {
       title: {$key: 'showTimesFor', tpl:'{0} {movieName}'}
   }
}
```

Assuming that 'showTimesFor' has string 'Show times for:' after localization object will look as follows
Note: movieName will come from your viewModel data.
```
{
   xtype: 'panel',
   bind: {
       title: 'Show times for: {movieName}'
   }
}
```

If the key is not found, in development mode, message like this will be displayed in the console:
```
Missing localization for "title" with value "^title3" in dictionary for package: test1
```
'title' property will remain untranslated and carry value "^title3"

####Example 4
Direct access to dictionary
```
Localize.Base.lookup('navigation.users', 'Sample');
```


#
#### Payload examples

locale-en-US.json
```
{
  "title": "User registration panel",
  "title2": "Something great",
  "content": {
    "dummy": "Content goes here"
  }
}
```

locale-es-ES.json

```
{
  "title": "Panel de registro de usuario",
  "content": {
    "dummy": "El contenido va aquí"
  }
}
```


#
#### Installation and Config
1) Add this package to your local packages folder
2) In app.json build profile add localize package as requirement, e.g. 
```
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
3) In every package that should be localized add the following config to the package.json
```
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
Example index.html script block:
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
                    // Optionally enable runtime debug messages
                    debug: true
                };
            };
        };

```

#

Example project can be fond here:
https://github.com/jurisv/Localize


####The MIT License (MIT)
Copyright (c) 2016 Juris Vecvanags

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.