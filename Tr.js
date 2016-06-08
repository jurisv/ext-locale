//Class that provides mechanism for lightweight localisation using Predefined dictionary object
/**
 * Example 1
 * Field label will be replaced with firstName content from dictionary
 * {
 *      xtype: 'textfield',
 *      fieldLabel: {_tr: 'firstName'},
 *      name: 'firstName'
 * }
 *
 * Example 2
 * Text will be replaced using template tpl and content of FwaAbbrevLabel will be applied to placeholder {0}
 * {
 *      dataIndex: 'lastName',
 *      text: {_tr: 'lastNameLabel', tpl: '{0} Name'}
 * }
 *
 * If the key is not found, in development mode, message like this will be displayed in the console:
 * Missing localization for {_tr: "foo", tpl: "{0} Name"} in Test.view.Main
 *
 */
Ext.define('jurisv.ext-locale.Tr', {
    singleton: true,
    /**
     * @cfg dictionary Namespace where key / value pairs can be located
     */
    dictionary: 'Tr',

    findObject: function (namespace) {
        var tokens = namespace.split('.');

        return tokens.reduce(function (last, curr) {
            return (typeof last == "undefined") ? last : last[curr];
        }, window);
    }

}, function () {

    Ext.override(Ext.Base, {
        initConfig: function (instanceConfig) {
            var me = this,
                ns = jurisv.ext-locale.Tr,
                dic = ns.findObject(ns.dictionary),
                cfg = me.getConfigurator(),
                k;

            me.initConfig = Ext.emptyFn;
            me.initialConfig = instanceConfig || {};

            if (dic) {
                for (k in instanceConfig) {
                    if (
                        instanceConfig[k] &&
                        typeof instanceConfig[k] === 'object' &&
                        instanceConfig[k]._tr) {

                        //<debug>
                        if (!dic[instanceConfig[k]._tr]) {
                            console.warn('Missing localization for object', instanceConfig[k], ' in ', this.$className);
                        }
                        //</debug>

                        instanceConfig[k] = instanceConfig[k].tpl ? Ext.String.format(instanceConfig[k].tpl, dic[instanceConfig[k]._tr]) : dic[instanceConfig[k]._tr];
                    }
                }
            }

            cfg.configure(me, instanceConfig);

            return me;
        }
    });
});
