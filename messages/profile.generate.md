# summary

Updates profile metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

# description

Updates profile metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

# flags.input.summary

input file to be converted to xml files

# flags.outputdir.summary

output directory where metadata are saved

# flags.source.summary

directory where source files you convert are stored

# flags.delimiter.summary

delimiter for the input file. the default value is comma

# error.path.input

Cannot find the input:

# error.path.output

Cannot find the output-directory:

# error.path.source

Cannot find the source:

# error.source.extension

Name of extension of source must be .profile-meta.xml.

# validation

Validtion error

# validation.editable.options

editable must be true or false.

# validation.readable.options

readable must be true or false.

# validation.allowcreate.options

allowCreate must be true or false.

# validation.allowdelete.options

allowDelete must be true or false.

# validation.allowedit.options

allowEdit must be true or false.

# validation.allowread.options

allowRead must be true or false.

# validation.modifyallrecords.options

modifyAllRecords must be true or false.

# validation.viewallrecords.options

viewAllRecords must be true or false.

# validation.default.options

default must be true or false.

# validation.visible.options

visible must be true or false.

# validation.enabled.options

enabled must be true or false.

# validation.visibility.options

visibility must be one of the followings:

# examples

- Converts metadata in sourcedir to a csv file in ouputdir:

  <%= config.bin %> <%= command.id %> --input ./input.csv --source ./source.profile-meta.xml --outputdir ./outputdir/

# info.profile.convert

profile generate
