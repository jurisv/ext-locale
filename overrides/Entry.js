//This override ensures that we are adding Localize library early as first package after Ext JS
Ext.define('Localize.overrides.Entry', {
    override: 'Ext.plugin.Manager',

    requires: [
        'Localize.Base'
    ]
});
