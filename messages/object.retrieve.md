# summary

Converts custom-object-xml-files to a file used to create or update the metadata.

# description

Converts custom-object-xml-files to a file used to create or update the metadata.

# flags.outputdir.summary

output directory where metadata are saved

# error.path.source

Cannot find the souce-directory

# error.path.output

Cannot find the output-directory

# flags.target-org.summary

Overrides your default org.

# flags.manifest.summary

File path for the manifest (package.xml) that specifies the components to retrieve.

# success

Successfully retrieved object metadata in

# examples

- Converts metadata in sourcedir to a csv file in ouputdir:

  <%= config.bin %> <%= command.id %> --sourcedir ./sourcedir/ --outputdir ./outputdir/

# info.object.convert

object convert
