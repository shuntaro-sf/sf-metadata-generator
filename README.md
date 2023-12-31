# @shuntaro/sf-metadata-generator

[![NPM](https://img.shields.io/npm/v/@shuntaro/sf-metadata-generator.svg?label=@shuntaro/sf-metadata-generator)](https://www.npmjs.com/package/@shuntaro/sf-metadata-generator) [![Downloads/week](https://img.shields.io/npm/dw/@shuntaro/.svg)](https://npmjs.org/package/@shuntaro/sf-metadata-generator) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/shuntaro-sf/sf-metadata-generator/main/LICENSE.txt)

# How to get started

Make sure you have already installed this plugin.

## Field metadata

To start generating field metadata, you need a csv file to include tab names e.g., fullName, label, type, ... , at the header and values for those tags to determine each detail of custom fields from the second line.

Other spreadsheet files are also supported as delimiter flag on the generator command can be any string.

The description of each tag is as follows. For further details of custrom-field-metadata, see [https://developer.salesforce.com/docs/atlas.en-us.242.0.api_meta.meta/api_meta/customfield.htm](https://developer.salesforce.com/docs/atlas.en-us.242.0.api_meta.meta/api_meta/customfield.htm)

| Tag                         | Description                                                                                                                                                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fullName                    | Custom field API name.                                                                                                                                                                                                                                                       |
| label                       | Field label name.                                                                                                                                                                                                                                                            |
| description                 | Field descritpion.                                                                                                                                                                                                                                                           |
| inlineHelpText              | Field-level help text.                                                                                                                                                                                                                                                       |
| type                        | Data type. Options are listed below:<br>AutoNumber, Checkbox, Currency, Date, DateTime, Email, Location, Number, Percent, Phone, Picklist, MultiselectPicklist, Text, TextArea, LongTextArea, Html, EncryptedText, Time, Url, Lookup, MasterDetail, ExternalLookup, Summary. |
| required                    | Whether it is required. Options are listed below:<br>true, false.                                                                                                                                                                                                            |
| externalId                  | Whether it is an external ID. Options are listed below:<br>true, false.                                                                                                                                                                                                      |
| trackHistory                | Whether to enableck history tracking. Options are listed below:<br>true, false.                                                                                                                                                                                              |
| trackTrending               | Whether to track historical trending. Options are listed below:<br>true, false.                                                                                                                                                                                              |
| unique                      | Whether it is unique. Options are listed below:<br>true, false.                                                                                                                                                                                                              |
| defaultValue                | Default value. For Checkbox data type. Options are listed below:<br>true, false.                                                                                                                                                                                             |
| displayFormat               | Display format for AutoNumber. Example: A-{0000}.                                                                                                                                                                                                                            |
| displayLocationInDecimal    | Whether to display location in decimal. Options are listed below:<br>true, false.                                                                                                                                                                                            |
| scale                       | Number of decimal places.                                                                                                                                                                                                                                                    |
| precision                   | Number of digits.                                                                                                                                                                                                                                                            |
| visibleLines                | Number of visible lines applied to MultiselectPicklist, LongTextArea, and Html.                                                                                                                                                                                              |
| length                      | Text length applied to Text, TextArea, LongTextArea, and Html.                                                                                                                                                                                                               |
| maskChar                    | Mask character applied to EncryptedText. Options are listed below:<br>asterisk, X.                                                                                                                                                                                           |
| maskType                    | Mask type applied to EncryptedText. Options are listed below:<br>all, lastFour, creditCard, nino, ssn, sin.                                                                                                                                                                  |
| picklistFullName            | Picklist API Names applied to Picklist and MultiselectPicklist. Note that semicolon ';' is used as the default delimiter to separate character string to multiple names. The delimiter can be chenged giving the picklistdelimiter.                                          |
| picklistLabel               | Picklist labels applied to Picklist and MultiselectPicklist. Note that semicolon ';' is used as the default delimiter to separate character string to multiple labels. The delimiter can be chenged giving the picklistdelimiter.                                            |
| caseSensitive               | Whether the field is case-sensitive. Applied only for Text. Options are listed below:<br>true, false.                                                                                                                                                                        |
| referenceTo                 | Object FullName that the object of this field references to.                                                                                                                                                                                                                 |
| relationshipLabel           | Label for relationship.                                                                                                                                                                                                                                                      |
| relationshipName            | Child relationship name applied for Lookup, MasterDetail, and ExternalLookup.                                                                                                                                                                                                |
| relationshipOrder           | Order of master-detail relationship. Options are listed below:<br>0, 1.                                                                                                                                                                                                      |
| deleteConstraint            | Deletion options for lookup relationships. Options are listed below:<br>Cascade, Restrict, SetNull.                                                                                                                                                                          |
| reparentableMasterDetail    | Whether the child records in a master-detail relationship on a custom object can be reparented to different parent records. Options are listed below:<br>true, false.                                                                                                        |
| writeRequiresMasterRead     | Whether to allow users with Read access to the primary record permission to create, edit, or delete child records. Options are listed below:<br>true, false.                                                                                                                 |
| summaryForeignKey           | Represents the master-detail field on the child that defines the relationship between the parent and the child. Example: ChildObject.ParentObject.                                                                                                                           |
| summaryOperation            | Type of operation for roll-up summary field. Options are listed below:<br>count, sum, min, max.                                                                                                                                                                              |
| summarizedField             | Represents the field on the detail row that is being summarized. Example: ChildObject.Field.                                                                                                                                                                                 |
| summaryFilterItemsField     | Represents the field to filter items.                                                                                                                                                                                                                                        |
| summaryFilterItemsOperation | Type of comparison operation to filter items. Options are listed below:<br>equals,notEqual,lessThan,greaterThan,lessOrEqual,greaterOrEqual,contains,notContain,startsWith,includes,excludes,within.                                                                          |
| summaryFilterItemsValue     | Value to compare with summaryFilterItemsField.                                                                                                                                                                                                                               |

Or you can create a template file running the following commnad:

```
  $ sf metadata field template --outputdir ./outputdir/
```

Then, `sf metadata field generate` generates custom field metadata of the input-csv-file.

The flag `--input` specifies the input-csv-file to be converted to metadata-xml-files and `--outputdir` the directory to save those xml files.

```
  $ sf metadata field generate --input ./input.csv --outputdir ./outputdir/
```

You can also update custom-field-xml-files with `sf metadata field convert` or `sf metadata field retrieve`. Assume you have created SFDX project and retrieved field-xml files you want to update. Then, run the following command to rewrite the files in the csv format.

```
  $ sf metadata field convert -sourcedir ./force-app/main/default/objects/Account/fields/ --outputdir ../outputdir/
```

Or run retrieve command to call metadata API to get all field metadata specified in a manifest file:

```
  $ sf metadata field retrieve --target-org <your org alias> -manifest ./force-app/main/default/manifest/package.xml --outputdir ../outputdir/
```

Edit the craeted csv file as you want to update metadata, and then run `sf metadata field generate --updates` to override the xml files.

Note that runnning without `--updates` avoids overrinding existing metadata.

```
  $ sf metadata field generate --input ./input.csv --outputdir ./outputdir/ --updates
```

## Object metadata

To start generating object metadata, you need a csv file to include tab names e.g., fullName, label, allowInChatterGroups, ... , at the header and values for those tags to determine each detail of custom objects from the second line.

Other spreadsheet files are also supported as delimiter flag on the generator command can be any string.

The description of each tag is as follows. For further details of custrom-object-metadata, see [https://developer.salesforce.com/docs/atlas.en-us.242.0.api_meta.meta/api_meta/customobject.htm](https://developer.salesforce.com/docs/atlas.en-us.242.0.api_meta.meta/api_meta/customobject.htm)

| Tag                    | Description                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| fullName               | Custom object API name.                                                                                                      |
| label                  | Custom object label name.                                                                                                    |
| description            | Object descritpion.                                                                                                          |
| allowInChatterGroups   | Whether to allow records of this custom object type to be added to Chatter groups. Options are listed below:<br>true, false. |
| deploymentStatus       | Deployment status. Options are listed below:<br>Deployed, InDevelopment.                                                     |
| enableActivities       | Whether to enable activities. Options are listed below:<br>true, false.                                                      |
| enableBulkApi          | Whether to enable bulk API. Options are listed below:<br>true, false.                                                        |
| enableHistory          | Whether to enable history. Options are listed below:<br>true, false.                                                         |
| enableReports          | Whether to enable reports. Options are listed below:<br>true, false.                                                         |
| enableSearch           | Whether to enable search. Options are listed below:<br>true, false.                                                          |
| enableSharing          | Whether to enable sharing. Options are listed below:<br>true, false.                                                         |
| enableStreamingApi     | Whether to enable sreaming API. Options are listed below:<br>true, false.                                                    |
| nameFieldType          | Type of name field. Options are listed below:<br>Text, AutoNumber.                                                           |
| nameFieldLabel         | Label for name field.                                                                                                        |
| nameFieldDisplayFormat | Name field display format. Applied when nameFieldType is set to AutoNumber.                                                  |

Or you can create a template file running the following commnad:

```
  $ sf metadata object template --outputdir ./outputdir/
```

Then, `sf metadata object generate` generates custom object metadata of the input-csv-file.

The flag `--input` specifies the input-csv-file to be converted to metadata-xml-files and `--outputdir` the directory to save those xml files.

```
  $ sf metadata object generate --input ./input.csv --outputdir ./outputdir/
```

You can also update custom-object-xml-files with `sf metadata object convert`. Assume you have created SFDX project and retrieved object-xml files you want to update. Then, run the following command to rewrite the files in the csv format.

```
  $ sf metadata object convert -sourcedir ./force-app/main/default/objects/ --outputdir ../outputdir/
```

Or run retrieve command to call metadata API to get all field metadata specified in a manifest file:

```
  $ sf metadata object retrieve --target-org <your org alias> -manifest ./force-app/main/default/manifest/package.xml --outputdir ../outputdir/
```

Edit the craeted csv file as you want to update metadata, and then run `sf metadata object generate --updates` to override the xml files.

Note that runnning without `--updates` avoids overrinding existing metadata.

```
  $ sf metadata object generate --input ./input.csv --outputdir ./outputdir/ --updates
```

## PermissionSet metadata

Only update is supported for permissionset metadata due to dependencies on other metadata.

You can rewrite a permissionset xml file in the csv format as shown in field metadata by runnning `metadata field convert`.

```
  $ sf metadata field convert -sourcedir ./force-app/main/default/permissionsets/xxx.permissionset-meta.xml --outputdir ../outputdir/
```

Edit the craeted csv file as you want to update metadata. The description of the output csv file is as follows. For further details of permissionset-metadata, see [https://developer.salesforce.com/docs/atlas.en-us.242.0.api_meta.meta/api_meta/meta_permissionset.htm](https://developer.salesforce.com/docs/atlas.en-us.242.0.api_meta.meta/api_meta/meta_permissionset.htm)

| Tag              | Description                                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fullName         | FullName to update.                                                                                                                                                                                     |
| type             | Field Name to update. Options are listed below:<br>applicationVisibilities, classAccesses, fieldPermissions, objectPermissions, pageAccesses, recordTypeVisibilities, tabVisibilities, userPermissions. |
| editable         | Whether it is allowed to edit the field of fullName. Options are listed below:<br>true, false.                                                                                                          |
| readable         | Whether it is allowed to read the field of fullName. Options are listed below:<br>true, false.                                                                                                          |
| allowCreate      | Whether it is allowed to create the object of fullName. Options are listed below:<br>true, false.                                                                                                       |
| allowDelete      | Whether it is allowed to delete the object of fullName. Options are listed below:<br>true, false.                                                                                                       |
| allowEdit        | Whether it is allowed to edit the object of fullName. Options are listed below:<br>true, false.                                                                                                         |
| allowRead        | Whether it is allowed to read the object of fullName. Options are listed below:<br>true, false.                                                                                                         |
| modifyAllRecords | Whether it is allowed to modify all records of the object of fullName.Options are listed below:<br>true, false.                                                                                         |
| viewAllRecords   | Whether it is allowed to view all records of the object of fullName. Options are listed below:<br>true, false.                                                                                          |
| default          | Whether it is default. Applied for recordTypeVisibilities. Options are listed below:<br>true, false.                                                                                                    |
| visible          | Whether it is visible. Applied for applicationVisibilities and recordTypeVisibilities. Options are listed below:<br>true, false.                                                                        |
| enabled          | Whether it is enabled. Applied for classAccesses, pageAccesses, and userPermissions. Options are listed below:<br>true, false.                                                                          |
| visibility       | Type of tag-visibility. Applied for tabVisibilities. Options are listed below:<br>DefaultOn, DefaultOff,Hidden                                                                                          |

Then, run `sf metadata permissionset generate --updates` to override the permissionset xml file.

```
  $ sf metadata permissionset generate --input ./input.csv --outputdir ../outputdir/
```

## Profile metadata

Only update is supported for profile metadata due to dependencies on other metadata.

You can rewrite a profile xml file in the csv format as shown in field metadata by runnning `metadata field convert`.

```
  $ sf metadata field convert -sourcedir ./force-app/main/default/profiles/xxx.profile-meta.xml --outputdir ../outputdir/
```

Edit the craeted csv file as you want to update metadata. The description of the output csv file is as follows. For further details of profile-metadata, see [https://developer.salesforce.com/docs/atlas.en-us.242.0.api_meta.meta/api_meta/meta_profile.htm](https://developer.salesforce.com/docs/atlas.en-us.242.0.api_meta.meta/api_meta/meta_profile.htm)

| Tag              | Description                                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fullName         | FullName to update.                                                                                                                                                                                     |
| type             | Field Name to update. Options are listed below:<br>applicationVisibilities, classAccesses, fieldPermissions, objectPermissions, pageAccesses, recordTypeVisibilities, tabVisibilities, userPermissions. |
| editable         | Whether it is allowed to edit the field of fullName. Options are listed below:<br>true, false.                                                                                                          |
| readable         | Whether it is allowed to read the field of fullName. Options are listed below:<br>true, false.                                                                                                          |
| allowCreate      | Whether it is allowed to create the object of fullName. Options are listed below:<br>true, false.                                                                                                       |
| allowDelete      | Whether it is allowed to delete the object of fullName. Options are listed below:<br>true, false.                                                                                                       |
| allowEdit        | Whether it is allowed to edit the object of fullName. Options are listed below:<br>true, false.                                                                                                         |
| allowRead        | Whether it is allowed to read the object of fullName. Options are listed below:<br>true, false.                                                                                                         |
| modifyAllRecords | Whether it is allowed to modify all records of the object of fullName.Options are listed below:<br>true, false.                                                                                         |
| viewAllRecords   | Whether it is allowed to view all records of the object of fullName. Options are listed below:<br>true, false.                                                                                          |
| default          | Whether it is default. Applied for applicationVisibilities and recordTypeVisibilities. Options are listed below:<br>true, false.                                                                        |
| visible          | Whether it is visible. Applied for applicationVisibilities and recordTypeVisibilities. Options are listed below:<br>true, false.                                                                        |
| enabled          | Whether it is enabled. Applied for classAccesses, pageAccesses, and userPermissions. Options are listed below:<br>true, false.                                                                          |
| visibility       | Type of tag-visibility. Applied for tabVisibilities. Options are listed below:<br>DefaultOn, DefaultOff,Hidden                                                                                          |

Then, run `sf metadata profile generate --updates` to override the profile xml file.

```
  $ sf metadata profile generate --input ./input.csv --outputdir ../outputdir/
```

## Tab metadata

To start generating tab metadata, you need a csv file to include tab names e.g., fullName, label, allowInChatterGroups, ... , at the header and values for those tags to determine each detail of custom tabs from the second line.

Other spreadsheet files are also supported as delimiter flag on the generator command can be any string.

The description of each tag is as follows. For further details of custrom-tab-metadata, see [https://developer.salesforce.com/docs/atlas.en-us.242.0.api_meta.meta/api_meta/customtab.htm](https://developer.salesforce.com/docs/atlas.en-us.242.0.api_meta.meta/api_meta/customtab.htm)

| Tag            | Description                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| fullName       | Custom tab API name.                                                                                         |
| label          | Custom tab label name.                                                                                       |
| type           | Type of tab. Options are listed below:<br>CustomObject, Visualforce, LightningComponent, LightningPage, Web. |
| description    | Tab descritpion.                                                                                             |
| customObject   | Whether it is custom object tab. Options are listed below:<br>true or false.                                 |
| flexiPage      | FullName of flexiPage applied when type is LightningPage.                                                    |
| frameHeight    | Frame height of page when type is Web.                                                                       |
| hasSidebar     | Whether page has a sidebar. Applied only for Web tab.                                                        |
| lwcComponent   | FullName of flexiPage applied when type is LightningComponent.                                               |
| motif          | Name of motif of tab.                                                                                        |
| page           | FullName of flexiPage applied when type is Visualforce.                                                      |
| splashPageLink | Splash page link.                                                                                            |
| url            | URL for web tab. Applied only for web tab.                                                                   |
| urlEncodingKey | ncoding key of URL. Options are listed below:<br>UTF-8,                                                      |

Or you can create a template file running the following commnad:

```
  $ sf metadata tab template --outputdir ./outputdir/
```

Then, `sf metadata tab generate` generates custom tab metadata of the input-csv-file.

The flag `--input` specifies the input-csv-file to be converted to metadata-xml-files and `--outputdir` the directory to save those xml files.

```
  $ sf metadata tab generate --input ./input.csv --outputdir ./outputdir/
```

You can also update custom-tab-xml-files with `sf metadata tab convert`. Assume you have created SFDX project and retrieved tab-xml files you want to update. Then, run the following command to rewrite the files in the csv format.

```
  $ sf metadata tab convert -sourcedir ./force-app/main/default/tabs/ --outputdir ../outputdir/
```

Or run retrieve command to call metadata API to get all field metadata specified in a manifest file:

```
  $ sf metadata tab retrieve --target-org <your org alias> -manifest ./force-app/main/default/manifest/package.xml --outputdir ../outputdir/
```

Edit the craeted csv file as you want to update metadata, and then run `sf metadata tab generate --updates` to override the xml files.

Note that runnning without `--updates` avoids overrinding existing metadata.

```
  $ sf metadata tab generate --input ./input.csv --outputdir ./outputdir/ --updates
```

## Install

```bash
sf plugins install @shuntaro/sf-metadata-generator@x.y.z
```

## Issues

Please report any issues at https://github.com/shuntaro-sf/sf-metadata-generator/issues

## Contributing

1. Please read our [Code of Conduct](CODE_OF_CONDUCT.md)
2. Create a new issue before starting your project so that we can keep track of
   what you are trying to add/fix. That way, we can also offer suggestions or
   let you know if there is already an effort in progress.
3. Fork this repository.
4. [Build the plugin locally](#build)
5. Create a _topic_ branch in your fork. Note, this step is recommended but technically not required if contributing using a fork.
6. Edit the code in your fork.
7. Write appropriate tests for your changes. Try to achieve at least 95% code coverage on any new code. No pull request will be accepted without unit tests.
8. Sign CLA (see [CLA](#cla) below).
9. Send us a pull request when you are done. We'll review your code, suggest any needed changes, and merge it in.

### CLA

External contributors will be required to sign a Contributor's License
Agreement. You can do so by going to https://cla.salesforce.com/sign-cla.

### Build

To build the plugin locally, make sure to have yarn installed and run the following commands:

```bash
# Clone the repository
git clone git@github.com:shuntaro/sf-metadata-generator

# Install the dependencies and compile
yarn && yarn build
```

To use your plugin, run using the local `./bin/dev` or `./bin/dev.cmd` file.

```bash
# Run using local run file.
./bin/dev metadata fil world
```

There should be no differences when running via the Salesforce CLI or using the local run file. However, it can be useful to link the plugin to do some additional testing or run your commands from anywhere on your machine.

```bash
# Link your plugin to the sf cli
sf plugins link .
# To verify
sf plugins
```

## Commands

<!-- commands -->

- [`sf metadata field convert`](#sf-metadata-field-convert)
- [`sf metadata field generate`](#sf-metadata-field-generate)
- [`sf metadata field retrieve`](#sf-metadata-field-retrieve)
- [`sf metadata field template`](#sf-metadata-field-template)
- [`sf metadata listview convert`](#sf-metadata-listview-convert)
- [`sf metadata listview generate`](#sf-metadata-listview-generate)
- [`sf metadata listview retrieve`](#sf-metadata-listview-retrieve)
- [`sf metadata listview template`](#sf-metadata-listview-template)
- [`sf metadata object convert`](#sf-metadata-object-convert)
- [`sf metadata object generate`](#sf-metadata-object-generate)
- [`sf metadata object retrieve`](#sf-metadata-object-retrieve)
- [`sf metadata object template`](#sf-metadata-object-template)
- [`sf metadata permissionset convert`](#sf-metadata-permissionset-convert)
- [`sf metadata permissionset generate`](#sf-metadata-permissionset-generate)
- [`sf metadata permissionset retrieve`](#sf-metadata-permissionset-retrieve)
- [`sf metadata profile convert`](#sf-metadata-profile-convert)
- [`sf metadata profile generate`](#sf-metadata-profile-generate)
- [`sf metadata profile retrieve`](#sf-metadata-profile-retrieve)
- [`sf metadata tab convert`](#sf-metadata-tab-convert)
- [`sf metadata tab generate`](#sf-metadata-tab-generate)
- [`sf metadata tab retrieve`](#sf-metadata-tab-retrieve)
- [`sf metadata tab template`](#sf-metadata-tab-template)

## `sf metadata field convert`

Converts custom-field-xml-files to a file used to create or update the metadata.

```
USAGE
  $ sf metadata field convert [--json] [-s <value>] [-e <value>] [-p <value>]

FLAGS
  -e, --outputdir=<value>          [default: ./] output directory where metadata are saved
  -p, --picklistdelimiter=<value>  [default: ;] delimiter for picklist fullNames and labels. the default value is
                                   semicolon
  -s, --sourcedir=<value>          directory where source files you convert are stored

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Converts custom-field-xml-files to a file used to create or update the metadata.

  Converts custom-field-xml-files to a file used to create or update the metadata.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata field convert --sourcedir ./sourcedir/ --outputdir ./outputdir/
```

## `sf metadata field generate`

Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

```
USAGE
  $ sf metadata field generate [--json] [-i <value>] [-e <value>] [-u] [-d <value>] [-p <value>]

FLAGS
  -d, --delimiter=<value>          [default: ,] delimiter for the input file. the default value is comma
  -e, --outputdir=<value>          [default: ./] output directory where metadata are saved
  -i, --input=<value>              input file to be converted to xml files
  -p, --picklistdelimiter=<value>  [default: ;] delimiter for picklist fullNames and labels. the default value is
                                   semicolon
  -u, --updates                    whether update existing xml files in outputdir or not

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

EXAMPLES
  Generates metadata from input to a csv file in ouputdir:

    $ sf metadata field generate --input ./input.csv --outputdir ./outputdir/
```

## `sf metadata field retrieve`

Converts custom-field-xml-files to a file used to create or update the metadata.

```
USAGE
  $ sf metadata field retrieve -o <value> -x <value> [--json] [-e <value>] [-p <value>]

FLAGS
  -e, --outputdir=<value>          [default: ./] output directory where metadata are saved
  -o, --target-org=<value>         (required) Overrides your default org.
  -p, --picklistdelimiter=<value>  [default: ;] delimiter for picklist fullNames and labels. the default value is
                                   semicolon
  -x, --manifest=<value>           (required) File path for the manifest (package.xml) that specifies the components to
                                   retrieve.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Converts custom-field-xml-files to a file used to create or update the metadata.

  Converts custom-field-xml-files to a file used to create or update the metadata.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata field retrieve --sourcedir ./sourcedir/ --outputdir ./outputdir/
```

## `sf metadata field template`

Creates a template input-csv-file.

```
USAGE
  $ sf metadata field template [--json] [-e <value>]

FLAGS
  -e, --outputdir=<value>  [default: ./] directory where a template csv file is saved.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Creates a template input-csv-file.

  Creates a template input-csv-file.

EXAMPLES
  Creates a template input-csv-file to ouputdir:

    $ sf metadata field template --outputdir ./outputdir/
```

## `sf metadata listview convert`

Converts custom-field-xml-files to a file used to create or update the metadata.

```
USAGE
  $ sf metadata listview convert [--json] [-s <value>] [-e <value>] [-c <value>]

FLAGS
  -c, --columnsdelimiter=<value>  [default: ;] delimiter for columns and filters. the default value is semicolon
  -e, --outputdir=<value>         [default: ./] output directory where metadata are saved
  -s, --sourcedir=<value>         directory where source files you convert are stored

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Converts custom-field-xml-files to a file used to create or update the metadata.

  Converts custom-field-xml-files to a file used to create or update the metadata.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata listview convert --sourcedir ./sourcedir/ --outputdir ./outputdir/
```

## `sf metadata listview generate`

Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

```
USAGE
  $ sf metadata listview generate [--json] [-i <value>] [-e <value>] [-u] [-d <value>] [-c <value>]

FLAGS
  -c, --columnsdelimiter=<value>  [default: ;] delimiter for picklist fullNames and labels. the default value is
                                  semicolon
  -d, --delimiter=<value>         [default: ,] delimiter for the input file. the default value is comma
  -e, --outputdir=<value>         [default: ./] output directory where metadata are saved
  -i, --input=<value>             input file to be converted to xml files
  -u, --updates                   whether update existing xml files in outputdir or not

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

EXAMPLES
  Generates metadata from input to a csv file in ouputdir:

    $ sf metadata listview generate --input ./input.csv --outputdir ./outputdir/
```

## `sf metadata listview retrieve`

Converts custom-field-xml-files to a file used to create or update the metadata.

```
USAGE
  $ sf metadata listview retrieve -o <value> -x <value> [--json] [-e <value>] [-c <value>]

FLAGS
  -c, --picklistdelimiter=<value>  [default: ;] delimiter for picklist fullNames and labels. the default value is
                                   semicolon
  -e, --outputdir=<value>          [default: ./] output directory where metadata are saved
  -o, --target-org=<value>         (required) Overrides your default org.
  -x, --manifest=<value>           (required) File path for the manifest (package.xml) that specifies the components to
                                   retrieve.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Converts custom-field-xml-files to a file used to create or update the metadata.

  Converts custom-field-xml-files to a file used to create or update the metadata.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata listview retrieve --sourcedir ./sourcedir/ --outputdir ./outputdir/
```

## `sf metadata listview template`

Creates a template input-csv-file.

```
USAGE
  $ sf metadata listview template [--json] [-e <value>]

FLAGS
  -e, --outputdir=<value>  [default: ./] directory where a template csv file is saved.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Creates a template input-csv-file.

  Creates a template input-csv-file.

EXAMPLES
  Creates a template input-csv-file to ouputdir:

    $ sf metadata listview template --outputdir ./outputdir/
```

## `sf metadata object convert`

Converts custom-object-xml-files to a file used to create or update the metadata.

```
USAGE
  $ sf metadata object convert [--json] [-s <value>] [-e <value>]

FLAGS
  -e, --outputdir=<value>  [default: ./] output directory where metadata are saved
  -s, --sourcedir=<value>  directory where source files you convert are stored

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Converts custom-object-xml-files to a file used to create or update the metadata.

  Converts custom-object-xml-files to a file used to create or update the metadata.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata object convert --sourcedir ./sourcedir/ --outputdir ./outputdir/
```

## `sf metadata object generate`

Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

```
USAGE
  $ sf metadata object generate [--json] [-i <value>] [-e <value>] [-u] [-d <value>]

FLAGS
  -d, --delimiter=<value>  [default: ,] delimiter for the input file. the default value is comma
  -e, --outputdir=<value>  [default: ./] output directory where metadata are saved
  -i, --input=<value>      input file to be converted to xml files
  -u, --updates            whether update existing xml files in outputdir or not

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata object generate --input ./input.csv --outputdir ./outputdir/
```

## `sf metadata object retrieve`

Converts custom-object-xml-files to a file used to create or update the metadata.

```
USAGE
  $ sf metadata object retrieve -o <value> -x <value> [--json] [-e <value>]

FLAGS
  -e, --outputdir=<value>   [default: ./] output directory where metadata are saved
  -o, --target-org=<value>  (required) Overrides your default org.
  -x, --manifest=<value>    (required) File path for the manifest (package.xml) that specifies the components to
                            retrieve.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Converts custom-object-xml-files to a file used to create or update the metadata.

  Converts custom-object-xml-files to a file used to create or update the metadata.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata object retrieve --sourcedir ./sourcedir/ --outputdir ./outputdir/
```

## `sf metadata object template`

Creates a template input-csv-file.

```
USAGE
  $ sf metadata object template [--json] [-e <value>]

FLAGS
  -e, --outputdir=<value>  [default: ./] directory where a template csv file is saved.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Creates a template input-csv-file.

  Creates a template input-csv-file.

EXAMPLES
  Creates a template input-csv-file to ouputdir:

    $ sf metadata object template --outputdir ./outputdir/
```

## `sf metadata permissionset convert`

Converts custom-field-xml-files to a file used to create or update the metadata.

```
USAGE
  $ sf metadata permissionset convert [--json] [-s <value>] [-e <value>]

FLAGS
  -e, --outputdir=<value>  [default: ./] output directory where metadata are saved
  -s, --source=<value>     directory where source files you convert are stored

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Converts custom-field-xml-files to a file used to create or update the metadata.

  Converts custom-field-xml-files to a file used to create or update the metadata.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata permissionset convert --sourcedir ./sourcedir/ --outputdir ./outputdir/
```

## `sf metadata permissionset generate`

Updates permissionset metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

```
USAGE
  $ sf metadata permissionset generate [--json] [-i <value>] [-e <value>] [-s <value>] [-d <value>]

FLAGS
  -d, --delimiter=<value>  [default: ,] delimiter for the input file. the default value is comma
  -e, --outputdir=<value>  [default: ./] output directory where metadata are saved
  -i, --input=<value>      input file to be converted to xml files
  -s, --source=<value>     directory where source files you convert are stored

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Updates permissionset metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

  Updates permissionset metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata permissionset generate --input ./input.csv --source ./source.permissionset-meta.xml --outputdir ^
      ./outputdir/
```

## `sf metadata permissionset retrieve`

Converts custom-field-xml-files to a file used to create or update the metadata.

```
USAGE
  $ sf metadata permissionset retrieve -o <value> -x <value> [--json] [-e <value>]

FLAGS
  -e, --outputdir=<value>   [default: ./] output directory where metadata are saved
  -o, --target-org=<value>  (required) Overrides your default org.
  -x, --manifest=<value>    (required) File path for the manifest (package.xml) that specifies the components to
                            retrieve.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Converts custom-field-xml-files to a file used to create or update the metadata.

  Converts custom-field-xml-files to a file used to create or update the metadata.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata permissionset retrieve --sourcedir ./sourcedir/ --outputdir ./outputdir/
```

## `sf metadata profile convert`

Converts custom-field-xml-files to a file used to create or update the metadata.

```
USAGE
  $ sf metadata profile convert [--json] [-s <value>] [-e <value>]

FLAGS
  -e, --outputdir=<value>  [default: ./] output directory where metadata are saved
  -s, --source=<value>     directory where source files you convert are stored

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Converts custom-field-xml-files to a file used to create or update the metadata.

  Converts custom-field-xml-files to a file used to create or update the metadata.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata profile convert --sourcedir ./sourcedir/ --outputdir ./outputdir/
```

## `sf metadata profile generate`

Updates profile metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

```
USAGE
  $ sf metadata profile generate [--json] [-i <value>] [-e <value>] [-s <value>] [-d <value>]

FLAGS
  -d, --delimiter=<value>  [default: ,] delimiter for the input file. the default value is comma
  -e, --outputdir=<value>  [default: ./] output directory where metadata are saved
  -i, --input=<value>      input file to be converted to xml files
  -s, --source=<value>     directory where source files you convert are stored

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Updates profile metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

  Updates profile metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata profile generate --input ./input.csv --source ./source.profile-meta.xml --outputdir ./outputdir/
```

## `sf metadata profile retrieve`

Converts custom-field-xml-files to a file used to create or update the metadata.

```
USAGE
  $ sf metadata profile retrieve -o <value> -x <value> [--json] [-e <value>]

FLAGS
  -e, --outputdir=<value>   [default: ./] output directory where metadata are saved
  -o, --target-org=<value>  (required) Overrides your default org.
  -x, --manifest=<value>    (required) File path for the manifest (package.xml) that specifies the components to
                            retrieve.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Converts custom-field-xml-files to a file used to create or update the metadata.

  Converts custom-field-xml-files to a file used to create or update the metadata.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata profile retrieve --sourcedir ./sourcedir/ --outputdir ./outputdir/
```

## `sf metadata tab convert`

Converts custom-tab-xml-files to a file used to create or update the metadata.

```
USAGE
  $ sf metadata tab convert [--json] [-s <value>] [-e <value>]

FLAGS
  -e, --outputdir=<value>  [default: ./] output directory where metadata are saved
  -s, --sourcedir=<value>  directory where source files you convert are stored

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Converts custom-tab-xml-files to a file used to create or update the metadata.

  Converts custom-tab-xml-files to a file used to create or update the metadata.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata tab convert --sourcedir ./sourcedir/ --outputdir ./outputdir/
```

## `sf metadata tab generate`

Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

```
USAGE
  $ sf metadata tab generate [--json] [-i <value>] [-e <value>] [-u] [-d <value>]

FLAGS
  -d, --delimiter=<value>  [default: ,] delimiter for the input file. the default value is comma
  -e, --outputdir=<value>  [default: ./] output directory where metadata are saved
  -i, --input=<value>      input file to be converted to xml files
  -u, --updates            whether update existing xml files in outputdir or not

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata tab generate --input ./input.csv --outputdir ./outputdir/
```

## `sf metadata tab retrieve`

Converts custom-tab-xml-files to a file used to create or update the metadata.

```
USAGE
  $ sf metadata tab retrieve -o <value> -x <value> [--json] [-e <value>]

FLAGS
  -e, --outputdir=<value>   [default: ./] output directory where metadata are saved
  -o, --target-org=<value>  (required) Overrides your default org.
  -x, --manifest=<value>    (required) File path for the manifest (package.xml) that specifies the components to
                            retrieve.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Converts custom-tab-xml-files to a file used to create or update the metadata.

  Converts custom-tab-xml-files to a file used to create or update the metadata.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata tab retrieve --sourcedir ./sourcedir/ --outputdir ./outputdir/
```

## `sf metadata tab template`

Creates a template input-csv-file.

```
USAGE
  $ sf metadata tab template [--json] [-e <value>]

FLAGS
  -e, --outputdir=<value>  [default: ./] directory where a template csv file is saved.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Creates a template input-csv-file.

  Creates a template input-csv-file.

EXAMPLES
  Creates a template input-csv-file to ouputdir:

    $ sf metadata tab template --outputdir ./outputdir/
```

<!-- commandsstop -->

<!-- commandsstop -->
