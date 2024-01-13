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

# flags.columnsdelimiter.summary

delimiter for picklist fullNames and labels. the default value is semicolon

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

fullName: API Name cannot contain two consecutive underscore characters,

# validation.fullname.blank

fullName: API Name must not be blank.

# validation.fullname.length

Length of fullName must be less than or equal to 40.

# validation.label.blank

label: Label Name must not be blank.

# validation.label.length

Length of label must be less than or equal to 40.

# validation.filterscope.options

summaryOperation must be one of the followings:

# validation.filtersfield.no.filtersoperation

filtersfield must be specified when summaryOperation is not count.

# validation.summaryforeignkey.invalid.reference

summaryForeignKey must be in the form of ObjectFullName.ObjectFullName.

# validation.summaryforeignkey.format

summaryForeignKey can only contain alphanumeric characters, must begin with a letter, cannot end with an underscore or contain two consecutive underscore characters.

# validation.summaryforeignkey.underscore

summaryForeignKey cannot contain two consecutive underscore characters,

# validation.summaryforeignkey.blank

summaryForeignKey must not be blank.

# validation.summaryforeignkey.length

Length of summaryForeignKey must be less than or equal to 40.

# validation.no.filtersfield

Column of filtersField can not be found.

# validation.no.filtersoperation

Column of filtersOperation can not be found.

# validation.no.filtersvalue

Column of filtersValue can not be found.

# validation.filtersfield.format

filtersField can only contain alphanumeric characters, must begin with a letter, cannot end with an underscore or contain two consecutive underscore characters.

# validation.filtersfield.underscore

filtersField cannot contain two consecutive underscore characters,

# validation.filtersfield.blank

filtersField must not be blank.

# validation.filtersfield.length

Length of filtersField must be less than or equal to 40.

# validation.filtersoperation.options

filtersOperation must be one of the followings:

# validation.filtersvalue.length

Length of filtersValue must be less than or equal to 255.

# validation.filtersfield.invalid.reference

filtersfield must be in the form of ObjectFullName.FieldFullName.

# validation.no.sharedtorole

Column of sharedToRole can not be found.

# validation.no.sharedtoroleandsubordinates

Column of sharedToRoleAndSubordinates can not be found.

# validation.no.sharedtogroup

Column of sharedToGroup can not be found.

# validation.sharedtorole.format

sharedToRole can only contain alphanumeric characters, must begin with a letter, cannot end with an underscore or contain two consecutive underscore characters.

# validation.sharedtorole.underscore

sharedToRole cannot contain two consecutive underscore characters.

# validation.sharedtorole.blank

sharedToRole must not be blank.

# validation.sharedtorole.length

Length of shardToRole must be less than or equal to 80.

# validation.sharedtoroleandsubordinates.format

sharedToRoleAndSubordinates can only contain alphanumeric characters, must begin with a letter, cannot end with an underscore or contain two consecutive underscore characters.

# validation.sharedtoroleandsubordinates.underscore

sharedToRoleAndSubordinates cannot contain two consecutive underscore characters.

# validation.sharedtoroleandsubordinates.blank

sharedToRoleAndSubordinates must not be blank.

# validation.sharedtoroleandsubordinates.length

Length of sharedToRoleAndSubordinates must be less than or equal to 80.

# validation.sharedtogroup.format

sharedToGroup can only contain alphanumeric characters, must begin with a letter, cannot end with an underscore or contain two consecutive underscore characters.

# validation.sharedtogroup.underscore

sharedToGroup cannot contain two consecutive underscore characters.

# validation.sharedtogroup.blank

sharedToGroup must not be blank.

# validation.sharedtogroup.length

Length of sharedToGroup must be less than or equal to 40.

# failureSave

To update exiting files, Add the flag --updates to this command.

# examples

- Generates metadata from input to a csv file in ouputdir:

  <%= config.bin %> <%= command.id %> --input ./input.csv --outputdir ./outputdir/

# info.field.generate

field generate
