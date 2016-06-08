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

1) Include the package jurisv.ext-locale in your project.
2)



TODO:
* Refactor in to Ext JS 6 package
* Add example
* Return unlocalized string for cases where localization is not found