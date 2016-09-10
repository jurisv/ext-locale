/**
 * Provides mechanism for lightweight localisation using Predefined dictionary object
 *
 * Example 1 - Simple string
 * Field label will be replaced with firstName content from dictionary
 *
 * Two formats are supported - String and object
 *
 * String format
 *
 * {
 *      xtype: 'textfield',
 *      fieldLabel: '~firstName',
 *      name: 'firstName'
 * }
 *
 *
 * Namespaced (nested)
 * {
 *      xtype: 'panel',
 *      html: '~content.dummy'
 * }
 *
 * Foreign package
 * Separate package name from variable via pipe. To access variables from main app, use the app name as package
 * For example if your app has name 'Sample', then string would look like this: html: '~Sample|home'
 * {
 *      xtype: 'checkbox',
 *      html: '~common|yes'
 * }
 *
 *
 * Example 2 - Object format
 *
 * {
 *      xtype: 'textfield',
 *      fieldLabel: {$key: 'firstName'},
 *      name: 'firstName'
 * }
 *
 * Text will be replaced using template tpl and content of lastNameLabel will be applied to placeholder {0}
 * Optionally you can specify foreign package
 * {
 *      dataIndex: 'lastName',
 *      text: {$key: 'lastNameLabel', tpl: '{0} Name', pkg: 'common'}
 * }
 *
 * Example 3
 * Support within bindings
 *
 * {
 *      xtype: 'panel',
 *      bind: {
 *          title: {$key: 'showTimesFor', tpl:'{0} {movieName}'}
 *      }
 * }
 *
 * Assuming that 'showTimesFor' has string 'Show times for:' after localization object will look as follows.
 * Note: movieName will come from your viewModel data.
 *
 * {
 *      xtype: 'panel',
 *      bind: {
 *          title: 'Show times for: {movieName}'
 *      }
 * }
 *
 * If the key is not found, in development mode, message like this will be displayed in the console:
 * Missing localization for "title" with value "~title3" in dictionary for package: test1
 * 'title' property will remain untranslated and carry value "~title3"
 *
 * Example 4
 * Direct access to dictionary
 * Localize.Base.lookup('navigation.users', 'Sample');
 */
Ext.define('Localize.Base', {

    statics: {
        /**
         * @private
         */
        packageHash: {},

        /**
         * @private
         */
        dictionaries: {},

        /**
         * Lookup string in dictionary for given package
         * @param key
         * @param pkg
         * @returns {String|undefined}
         */
        lookup: function (key, pkg) {
            return new Function('_', 'return _.' + key)(this.dictionaries[pkg].dic)
        }
    }
}, function () {
    var me = this,
        Manifest = Ext.manifest,
        cfg = Manifest.localize,
        packages = Manifest.packages,
        counter, key;

    Ext.Class.registerPreprocessor('localize',
        function (cls, data) {
            // We walk only User classes
            var Loc = Localize.Base,
                Class = Ext.Class;

            if (Loc.dataLoaded) {
                if (data.$className && data.$className.indexOf('Ext.') !== 0) {
                    // Recursively walk config data

                    Class.iterateObj(data.$className, Class.findPackageFromClass(Loc.packageHash, data.$className), data);
                    //TODO Remove once stable
                    //console.log('Localize data:', data.$className, data);
                }
            }

            return true;
        }, true, 'before', 'className'
    );

    Ext.Class.iterateObj = function (cls, pkg, obj, stack) {
        var Loc = Localize.Base,
            property, value, str, parts;

        //<debug>
        if (obj.hasOwnProperty('$observableInitialized')) {
            console.warn("The following property can't be localized as it's content is already initialized. Typically this means that config or class property has initialized using Ext.create.", obj);
            return;
        }
        //</debug>
        for (property in obj) {
            if (obj.hasOwnProperty(property)) {
                value = obj[property];

                //Ignore values that can't hold localization
                if (!value || typeof value === 'function' || typeof value === 'boolean') {
                    continue;
                }

                // String notation
                if (typeof value === 'string' && value.indexOf('~') === 0) {
                    str = value.substr(1);

                    // Check for package
                    parts = str.split('|');
                    if (parts.length > 1) {
                        // Foreign package specified
                        obj[property] = Loc.lookup(parts[1], parts[0]);
                    } else {
                        obj[property] = Loc.lookup(str, pkg);
                    }

                    if (!obj[property]) {
                        //<debug>
                        if (cfg.debug) {
                            console.warn('Missing localization for "' + property + '"' + ' with value "' + value + '" in class "' + cls + '", package: ' + pkg);
                        }
                        //</debug>
                        obj[property] = value;
                    }
                } else if (typeof value === 'object') { //Object notation or recursion

                    // Check if this object is localization
                    if (value.$key) {
                        obj[property] = Loc.lookup(value.$key, value.pkg || pkg);

                        if (obj[property]) {
                            if (value.tpl) {
                                obj[property] = value.tpl.replace('{0}', obj[property]);
                            }
                        } else {
                            //<debug>
                            if (cfg.debug) {
                                console.warn('Missing localization for "' + property + '"' + ' with value "' + value.$key + '" in class "' + cls + '", package: ' + pkg);
                            }
                            //</debug>
                            obj[property] = '~' + value.$key;
                        }
                    } else {
                        // Proceed with recursion
                        Ext.Class.iterateObj(cls, pkg, obj[property], stack + '.' + property);
                    }
                }
            }
        }
    };

    Ext.Class.findPackageFromClass = function (hash, className) {
        var found = false,
            weight = 0,
            len;

        for (var p in hash) {
            if (hash.hasOwnProperty(p) && className.indexOf(p) === 0) {
                len = (p.split('.').length - 1);

                if (len >= weight) {
                    found = hash[p];
                    weight = len;
                }
            }
        }

        return found;
    };

    //<debug>
    if (!cfg) {
        console.warn("Ext.manifest is missing localize config. Can't continue!");
        return true;
    }
    //</debug>

    // Add Main application
    me.dictionaries[Manifest.name] = {
        path: Ext.getResourcePath(Ext.String.format(cfg.urlTpl, cfg.language))
    };

    me.packageHash[Manifest.name] = Manifest.name;

    //Add packages
    if (cfg.usePackages) {
        //Search for packages that should be localized
        for (key in packages) {
            if (packages.hasOwnProperty(key) && packages[key].localize) {
                me.dictionaries[key] = {
                    path: Ext.getResourcePath(Ext.String.format(cfg.urlTpl, cfg.language), null, key.toLowerCase())
                };

                me.packageHash[packages[key].namespace] = key;
            }
        }
    }

    counter = Object.keys(me.dictionaries).length;

    for (key in me.dictionaries) {
        if (me.dictionaries.hasOwnProperty(key)) {
            Ext.Ajax.request({
                url: me.dictionaries[key].path,
                key: key,
                async: false, // We have to use sync request to ensure that our locales are available prior class definition

                callback: function (options, success, response) {
                    if (success) {
                        me.dictionaries[options.key].dic = Ext.decode(response.responseText);
                    }

                    if (!--counter) {
                        //<debug>
                        if (cfg.debug) {
                            console.log('Available locales:');
                            console.dir(me.dictionaries);
                        }
                        //</debug>

                        me.dataLoaded = true;
                    }
                },

                failure: function (response, opts) {
                    //<debug>
                    console.error('Missing locale');
                    //</debug>
                }
            });
        }
    }
});
