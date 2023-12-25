# summary

Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

# description

Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv to xml files.

# flags.input.summary

input file to be converted to xml files

# flags.outputdir.summary

output directory where metadata are saved

# flags.updates.summary

whether update existing xml files in outputdir or not

# flags.delimiter.summary

delimiter for the input file. the default value is comma

# error.path.input

Cannot find the input:

# error.path.output

Cannot find the output-directory:

# validation

Validtion error

# validation.fullname.format

fullName: API Name can only contain alphanumeric characters, must begin with a letter, cannot end with an underscore or contain two consecutive underscore characters.

# validation.fullname.tail

fullName: API Name must end with '\_\_c'.

# validation.fullname.underscore

fullName: API Name cannot contain two consecutive underscore characters.

# validation.fullname.blank

fullName: API Name must not be blank.

# validation.fullname.length

Length of fullName must be less than or equal to 40.

# validation.externalid.options

externalId must be true or false.

# validation.label.blank

label: Label Name must not be blank.

# validation.label.length

Length of label must be less than or equal to 40.

# validation.allowinchattergroups.options

allowInChatterGroups value must be true or false.

# validation.deploymentstatus.options

deploymentStatus must be one of the followings:

# validation.enableactivities.options

enableActivities value must be true or false.

# validation.enablebulkapi.options

enableBulkApi value must be true or false.

# validation.enablefeeds.options

enableFeeds value must be true or false.

# validation.enablehistory.options

enableHistory value must be true or false.

# validation.enablereports.options

enableReports value must be true or false.

# validation.enablesearch.options

enableSearch value must be true or false.

# validation.enablesharing.options

enableSharing value must be true or false.

# validation.enablestreamingapi.options

enableStreamingApi value must be true or false.

# validation.no.namefieldtype

Column of nameFieldType can not be found.

# validation.namefieldtype.options

nameFieldType must be one of the followings:

# validation.no.namefieldlabel

Column of nameFieldLabel can not be found.

# validation.namefieldlabel.blank

nameFieldLabel must not be blank.

# validation.namefieldlabel.length.format

Length of nameFieldLabel must be less than or equal to 80.

# validation.no.namefielddisplayformat

Column of nameFieldDisplayFormat can not be found.

# validation.namefielddisplayformat.invalid.char

nameFieldDisplayFormat can not contain the following characters:

# validation.namefielddisplayformat.format

nameFieldDisplayFormat must include sequence number substitution variable. Example: A-{0000}.

# validation.namefielddisplayformat.digits

Digits of nameFieldDisplayFormat must be less than or equal to 10.

# validation.namefielddisplayformat.length

Length of nameFieldDisplayFormat must be less than or equal to 30.

# validation.description.length

Length of description must be less than or equal to 1000.

# validation.inlinehelptext.length

Length of inlineHelpText must be less than or equal to 510.

# validation.sharingModel.options

sharingModel must be one of the followings:

# validation.externalSharingModel.options

externalSharingModel must be one of the followings:

# failureSave

To update exiting files, Add the flag --updates to this command.

# examples

- Converts metadata in sourcedir to a csv file in ouputdir:

  <%= config.bin %> <%= command.id %> --input ./input.csv --outputdir ./outputdir/

# info.field.generate

object generate
