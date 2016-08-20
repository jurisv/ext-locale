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
 *      fieldLabel: '^firstName',
 *      name: 'firstName'
 * }
 *
 *
 * Namespaced (nested)
 * {
 *      xtype: 'panel',
 *      html: '^content.dummy'
 * }
 *
 * Foreign package
 * Separate package name from variable via pipe. To access variables from main app, use the app name as package
 * For example if your app has name 'Sample', then string would look like this: html: '^Sample|home'
 * {
 *      xtype: 'checkbox',
 *      html: '^common|yes'
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
 * Missing localization for "title" with value "^title3" in dictionary for package: test1
 * 'title' property will remain untranslated and carry value "^title3"
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

    Ext.Class.iterateObj = function (pkg, obj, stack) {
        var Loc = Localize.Base,
            property, value, str, parts;

        for (property in obj) {
            if (obj.hasOwnProperty(property)) {
                value = obj[property];

                // String notation
                if (typeof value === 'string' && value.indexOf('^') === 0) {
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
                            console.warn('Missing localization for "' + property + '"' + ' with value "' + value + '" in dictionary for package: ' + pkg);
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
                                console.warn('Missing localization for "' + property + '"' + ' with value "' + value.$key + '" in dictionary for package: ' + pkg);
                            }
                            //</debug>
                            obj[property] = '^' + value.$key;
                        }
                    } else {
                        // Proceed with recursion
                        Ext.Class.iterateObj(pkg, obj[property], stack + '.' + property);
                    }
                }
            }
        }
    };

    Ext.Class.findPackageFromClass = function (hash, className) {
        for (var p in hash) {
            if (hash.hasOwnProperty(p) && className.indexOf(p) === 0) {
                return hash[p];
            }
        }
    };

    //<debug>
    if (!cfg) {
        console.error('Ext.manifest is missing localize config; terminatig.');
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
                        Ext.Class.registerPreprocessor('localize',
                            function (cls, data) {
                                // We walk only User classes
                                var Loc = Localize.Base,
                                    Class = Ext.Class;

                                if (data.$className && data.$className.indexOf('Ext.') !== 0) {
                                    // Recursively walk config data
                                    Class.iterateObj(Class.findPackageFromClass(Loc.packageHash, data.$className), data);
                                    //TODO Remove
                                    //console.log('Localize data:', data.$className, data);
                                }
                                return true;
                            }, true, 'before', 'className'
                        );

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
