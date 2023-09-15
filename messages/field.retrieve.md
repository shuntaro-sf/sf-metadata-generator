# summary

Converts custom-field-xml-files to a file used to create or update the metadata.

# description

Converts custom-field-xml-files to a file used to create or update the metadata.

# flags.sourcedir.summary

directory where source files you convert are stored

# flags.outputdir.summary

output directory where metadata are saved

# flags.picklistdelimiter.summary

delimiter for picklist fullNames and labels. the default value is semicolon

# error.path.source

Cannot find the souce-directory

# error.path.output

Cannot find the output-directory

# error.missing.id

ID not found.

# flags.target-org.summary

Overrides your default org.

# flags.manifest.summary

File path for the manifest (package.xml) that specifies the components to retrieve.

# success

Successfully retrieved field metadata in

# examples

- Converts metadata in sourcedir to a csv file in ouputdir:

  <%= config.bin %> <%= command.id %> --sourcedir ./sourcedir/ --outputdir ./outputdir/

# info.field.convert

field convert
