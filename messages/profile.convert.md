# summary

Converts custom-field-xml-files to a file used to create or update the metadata.

# description

Converts custom-field-xml-files to a file used to create or update the metadata.

# flags.source.summary

directory where source files you convert are stored

# flags.outputdir.summary

output directory where metadata are saved

# error.path.source

Cannot find the souce-directory

# error.path.output

Cannot find the output-directory

# error.source.extension

Name of extension of source must be .profile-meta.xml.

# examples

- Converts metadata in sourcedir to a csv file in ouputdir:

  <%= config.bin %> <%= command.id %> --sourcedir ./sourcedir/ --outputdir ./outputdir/

# info.field.convert

profile convert
