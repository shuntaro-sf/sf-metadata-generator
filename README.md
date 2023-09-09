# @shuntaro/sf-metadata-generator

[![NPM](https://img.shields.io/npm/v/@shuntaro/sf-metadata-generator.svg?label=@shuntaro/sf-metadata-generator)](https://www.npmjs.com/package/@shuntaro/sf-metadata-generator) [![Downloads/week](https://img.shields.io/npm/dw/@shuntaro/sf-metadata-generator.svg)](https://npmjs.org/package/@shuntaro/sf-metadata-generator) [![License](https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg)](https://raw.githubusercontent.com/salesforcecli/@shuntaro/sf-metadata-generator/main/LICENSE.txt)

## Using the template

This repository provides a template for creating a plugin for the Salesforce CLI. To convert this template to a working plugin:

1. Please get in touch with the Platform CLI team. We want to help you develop your plugin.
2. Generate your plugin:

   ```
   sf plugins install dev
   sf dev generate plugin

   git init -b main
   git add . && git commit -m "chore: initial commit"
   ```

3. Create your plugin's repo in the salesforcecli github org
4. When you're ready, replace the contents of this README with the information you want.

## Learn about `sf` plugins

Salesforce CLI plugins are based on the [oclif plugin framework](<(https://oclif.io/docs/introduction.html)>). Read the [plugin developer guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_plugins.meta/sfdx_cli_plugins/cli_plugins_architecture_sf_cli.htm) to learn about Salesforce CLI plugin development.

This repository contains a lot of additional scripts and tools to help with general Salesforce node development and enforce coding standards. You should familiarize yourself with some of the [node developer packages](#tooling) used by Salesforce.

Additionally, there are some additional tests that the Salesforce CLI will enforce if this plugin is ever bundled with the CLI. These test are included by default under the `posttest` script and it is required to keep these tests active in your plugin if you plan to have it bundled.

### Tooling

- [@salesforce/core](https://github.com/forcedotcom/sfdx-core)
- [@salesforce/kit](https://github.com/forcedotcom/kit)
- [@salesforce/sf-plugins-core](https://github.com/salesforcecli/sf-plugins-core)
- [@salesforce/ts-types](https://github.com/forcedotcom/ts-types)
- [@salesforce/ts-sinon](https://github.com/forcedotcom/ts-sinon)
- [@salesforce/dev-config](https://github.com/forcedotcom/dev-config)
- [@salesforce/dev-scripts](https://github.com/forcedotcom/dev-scripts)

### Hooks

For cross clouds commands, e.g. `sf env list`, we utilize [oclif hooks](https://oclif.io/docs/hooks) to get the relevant information from installed plugins.

This plugin includes sample hooks in the [src/hooks directory](src/hooks). You'll just need to add the appropriate logic. You can also delete any of the hooks if they aren't required for your plugin.

# Everything past here is only a suggestion as to what should be in your specific plugin's description

This plugin is bundled with the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli). For more information on the CLI, read the [getting started guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm).

We always recommend using the latest version of these commands bundled with the CLI, however, you can install a specific version or tag if needed.

## Install

```bash
sf plugins install @shuntaro/sf-metadata-generator@x.y.z
```

## Issues

Please report any issues at https://github.com/forcedotcom/cli/issues

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
git clone git@github.com:salesforcecli/@shuntaro/sf-metadata-generator

# Install the dependencies and compile
yarn && yarn build
```

To use your plugin, run using the local `./bin/dev` or `./bin/dev.cmd` file.

```bash
# Run using local run file.
./bin/dev hello world
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
- [`sf metadata field template`](#sf-metadata-field-template)
- [`sf metadata object convert`](#sf-metadata-object-convert)
- [`sf metadata object generate`](#sf-metadata-object-generate)
- [`sf metadata object template`](#sf-metadata-object-template)
- [`sf metadata profile convert`](#sf-metadata-profile-convert)
- [`sf metadata profile generate`](#sf-metadata-profile-generate)

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

Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

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
  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

EXAMPLES
  Generates metadata from input to a csv file in ouputdir:

    $ sf metadata field generate --input ./input.csv --outputdir ./outputdir/
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

## `sf metadata object convert`

Converts custom-field-xml-files to a file used to create or update the metadata.

```
USAGE
  $ sf metadata object convert [--json] [-s <value>] [-e <value>]

FLAGS
  -e, --outputdir=<value>  [default: ./] output directory where metadata are saved
  -s, --sourcedir=<value>  directory where source files you convert are stored

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Converts custom-field-xml-files to a file used to create or update the metadata.

  Converts custom-field-xml-files to a file used to create or update the metadata.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata object convert --sourcedir ./sourcedir/ --outputdir ./outputdir/
```

## `sf metadata object generate`

Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

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
  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata object generate --input ./input.csv --outputdir ./outputdir/
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

Updates profile metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

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
  Updates profile metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

  Updates profile metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata profile generate --input ./input.csv --source ./source.profile-meta.xml --outputdir ./outputdir/
```

<!-- commandsstop -->

- [`sf metadata field convert`](#sf-metadata-field-convert)
- [`sf metadata field generate`](#sf-metadata-field-generate)
- [`sf metadata field template`](#sf-metadata-field-template)
- [`sf metadata object convert`](#sf-metadata-object-convert)
- [`sf metadata object generate`](#sf-metadata-object-generate)
- [`sf metadata object template`](#sf-metadata-object-template)
- [`sf metadata profile convert`](#sf-metadata-profile-convert)
- [`sf metadata profile generate`](#sf-metadata-profile-generate)

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

Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

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
  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

EXAMPLES
  Generates metadata from input to a csv file in ouputdir:

    $ sf metadata field generate --input ./input.csv --outputdir ./outputdir/
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

## `sf metadata object convert`

Converts custom-field-xml-files to a file used to create or update the metadata.

```
USAGE
  $ sf metadata object convert [--json] [-s <value>] [-e <value>]

FLAGS
  -e, --outputdir=<value>  [default: ./] output directory where metadata are saved
  -s, --sourcedir=<value>  directory where source files you convert are stored

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Converts custom-field-xml-files to a file used to create or update the metadata.

  Converts custom-field-xml-files to a file used to create or update the metadata.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata object convert --sourcedir ./sourcedir/ --outputdir ./outputdir/
```

## `sf metadata object generate`

Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

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
  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata object generate --input ./input.csv --outputdir ./outputdir/
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

Updates profile metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

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
  Updates profile metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

  Updates profile metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata profile generate --input ./input.csv --source ./source.profile-meta.xml --outputdir ./outputdir/
```

<!-- commandsstop -->

- [`sf metadata field convert`](#sf-metadata-field-convert)
- [`sf metadata field generate`](#sf-metadata-field-generate)
- [`sf metadata field template`](#sf-metadata-field-template)
- [`sf metadata object convert`](#sf-metadata-object-convert)
- [`sf metadata object generate`](#sf-metadata-object-generate)
- [`sf metadata object template`](#sf-metadata-object-template)
- [`sf metadata profile convert`](#sf-metadata-profile-convert)
- [`sf metadata profile generate`](#sf-metadata-profile-generate)

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

Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

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
  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

EXAMPLES
  Generates metadata from input to a csv file in ouputdir:

    $ sf metadata field generate --input ./input.csv --outputdir ./outputdir/
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

## `sf metadata object convert`

Converts custom-field-xml-files to a file used to create or update the metadata.

```
USAGE
  $ sf metadata object convert [--json] [-s <value>] [-e <value>]

FLAGS
  -e, --outputdir=<value>  [default: ./] output directory where metadata are saved
  -s, --sourcedir=<value>  directory where source files you convert are stored

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Converts custom-field-xml-files to a file used to create or update the metadata.

  Converts custom-field-xml-files to a file used to create or update the metadata.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata object convert --sourcedir ./sourcedir/ --outputdir ./outputdir/
```

## `sf metadata object generate`

Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

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
  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

  Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata object generate --input ./input.csv --outputdir ./outputdir/
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

Updates profile metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

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
  Updates profile metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

  Updates profile metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

EXAMPLES
  Converts metadata in sourcedir to a csv file in ouputdir:

    $ sf metadata profile generate --input ./input.csv --source ./source.profile-meta.xml --outputdir ./outputdir/
```

<!-- commandsstop -->

- [`sf hello world`](#sf-hello-world)

## `sf hello world`

Say hello either to the world or someone you know.

```
USAGE
  $ sf hello world [--json] [-n <value>]

FLAGS
  -n, --name=<value>  [default: World] The name of the person you'd like to say hello to.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Say hello either to the world or someone you know.

  Say hello either to the world or someone you know.

EXAMPLES
  Say hello to the world:

    $ sf hello world

  Say hello to someone you know:

    $ sf hello world --name Astro
```

<!-- commandsstop -->
