// CMD 6.5 dynamic package loader support. Allows locale files to be loaded on demand
Ext.define(null, {
    override: 'Ext.package.Entry',

    constructor: function (name) {
        var me = this,
            localize = Ext.manifest.localize;

        me.packageName = name;
        me.jsUrl = Ext.getResourcePath(name + '.js', null, name);
        me.cssUrl = Ext.getResourcePath(name + '.css', null, name);
        //me.localeUrl = Ext.getResourcePath('resources/' + Ext.String.format(localize.urlTpl, localize.language), null, name);
        // Temp workaround for dev mode;
        me.localeUrl = '/packages/local/' + name + '/resources/data/locale-en-US.json';

        me.promise = new Ext.Promise(function (resolve, reject) {
            me.resolveFn = resolve;
            me.rejectFn = reject;
        });
    },

    beginLoad: function () {
        var me = this;
        if (!me.loaded) {
            me.block();
            me.loadLocale(); // Added
            me.loadStyle();
            me.loadScript();
            me.unblock();
        }
    },

    loadLocale: function () {
        var me = this,
            metadata = me.metadata,
            required = metadata && metadata.required,
            Manifest = Ext.manifest,
            cfg = Manifest.localize;

        if (metadata.localize) { //Attempt to load only if this package is localized
            me.block();
            Ext.Ajax.request({
                url: me.localeUrl,

                callback: function (options, success, response) {
                    if (success) {
                        Localize.Base.dictionaries[me.packageName].dic = Ext.decode(response.responseText);
                    }
                    me.unblock();
                    //<debug>
                    if (cfg.debug) {
                        console.log('Localization for package "' + me.packageName + '" loaded');
                    }
                    //</debug>
                },

                failure: function (response, opts) {
                    //<debug>
                    if (!me.error) {
                        me.error = new Error('Failed to load "' + me.packageName + '"');
                        me.error.url = me.localeUrl;
                        me.unblock();
                    }
                    //</debug>
                }
            });
        }
    }
});
