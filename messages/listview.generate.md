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

# validation.summarizedfield.no.summaryoperation

summarizedField must be specified when summaryOperation is not count.

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

# validation.no.summaryfilteritemsfield

Column of summaryFilterItemsField can not be found.

# validation.no.summaryfilteritemsoperation

Column of summaryFilterItemsOperation can not be found.

# validation.no.summaryfilteritemsvalue

Column of summaryFilterItemsValue can not be found.

# validation.summaryfilteritemsfield.format

summarizedFilterItemsField can only contain alphanumeric characters, must begin with a letter, cannot end with an underscore or contain two consecutive underscore characters.

# validation.summaryfilteritemsfield.underscore

summarizedFilterItemsField cannot contain two consecutive underscore characters,

# validation.summaryfilteritemsfield.blank

summarizedFilterItemsField must not be blank.

# validation.summaryfilteritemsfield.length

Length of summarizedFilterItemsField must be less than or equal to 40.

# validation.summaryfilteritemsoperation.options

summarizedFilterItemsOperation must be one of the followings:

# validation.summaryfilteritemsvalue.length

Length of summaryFilterItemsValue must be less than or equal to 255.

# validation.summarizedfield.invalid.reference

summarizedField must be in the form of ObjectFullName.FieldFullName.

# failureSave

To update exiting files, Add the flag --updates to this command.

# examples

- Generates metadata from input to a csv file in ouputdir:

  <%= config.bin %> <%= command.id %> --input ./input.csv --outputdir ./outputdir/

# info.field.generate

field generate
