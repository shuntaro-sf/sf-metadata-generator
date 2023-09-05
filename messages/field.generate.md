# summary

Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

# description

Generates custom field metadata converting values in any sort of spreadsheets, e.g., csv and excel to xml files.

# flags.input.summary

input file to be converted to xml files

# flags.outputdir.summary

output directory where metadata are saved

# flags.updates.summary

whether update existing xml files in outputdir or not

# flags.delimiter.summary

delimiter for the input file. the default value is comma

# flags.picklistdelimiter.summary

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

# validation.externalid.options

externalId must be true or false.

# validation.label.blank

label: Label Name must not be blank.

# validation.label.length

Length of label must be less than or equal to 40.

# validation.required.options

required must be true or false.

# validation.no.type

Column of type can not be found.

# validation.type.options

type must be one of the followings:

# validation.no.formula

Column of formula can not be found.

# validation.formula.length

Length of formula must be less than or equal to 3900.

# validation.trackhistory.options

trackHistory must be true or false.

# validation.tracktrending.options

trackTrending must be true or false.

# validation.no.unique

Column of unique can not be found.

# validation.unique.options

unique must be true or false.

# validation.defaultvalue.options

default value must be true or false.

# validation.displayformat.invalid.char

displayFormat can not contain the following characters:

# validation.displayformat.format

displayFormat must include sequence number substitution variable. Example: A-{0000}.

# validation.displayformat.digits

Digits of displayFormat must be less than or equal to 10.

# validation.displayformat.length

Length of displayFormat must be less than or equal to 30.

# validation.displaylocationindecimal.options

displayLocationInDecimal must be true or false.

# validation.no.scale

Column of scale can not be found.

# validation.scale.type

scale: Decimal Places must be an integer.

# validation.scale.negative

scale Decimal Places must be a positive integer.

# validation.scale.sum

Sum of scale: Decimal Places and precision: Length must be an integer less than or equal to 18.

# validation.scale.comarison.precision

precision:Lebgth must be greater than scale.

# validation.no.precision

Column of precision can not be found.

# validation.precision.type

precision: Length must be an integer.

# validation.precision.negative

precision: Length must be a positive integer.

# validation.precision.sum

Sum of scale: Decimal Places and precision: Length must be an integer less than or equal to 18.

# validation.precision.comarison.scale

precision:Lebgth must be greater than scale.

# validation.visiblelines.type

visibleLines: Visible Lines must be an integer.

# validation.visiblelines.longtext.min

Number of visibleLines: Visible Lines must be greater than or equal to 2.

# validation.visiblelines.longtext.max

Number of visibleLines: Visible Lines must be an integer less than or equal to 50.

# validation.visiblelines.picklist.min

Number of visibleLines: Visible Lines must be greater than or equal to 3.

# validation.visiblelines.picklist.max

Number of visibleLines: Visible Lines must be an integer less than or equal to 10.

# validation.visiblelines.html.min

Number of visibleLines: Visible Lines must be greater than or equal to 10.

# validation.length.type

length must be an integer.

# validation.length.text.min

length must be greater than 0.

# validation.length.text.max

length must be an integer less than or equal to 255.

# validation.length.longtext.min

length must be greater than 255.

# validation.length.longtext.max

length must be an integer less than or equal to 131,072.

# validation.length.encryptedtext.max

length must be an integer less than or equal to 175.

# validation.maskchar.options

maskChar must be asterisk or X.

# validation.masktype.options

unique must be one of the followings:

# validation.casesensitive.options

caseSensitive must be true or false.

# validation.no.picklist.fullname

Column of picklistFullName can not be found.

# validation.no.picklist.label

Column of picklistLabel can not be found.

# validation.picklist.fullname.number

Number of picklistFullNames must be equal to the one of picklistLebels.

# validation.picklist.label.number

Number of picklistLabels must be equal to the one of picklistFullNames.

# validation.picklist.fullname.blank

picklistFullName must not be blank.

# validation.picklist.label.blank

picklistLabel must not be blank.

# validation.picklist.fullname.max

Length of picklistFullName must be less than or equal to 255.

# validation.picklist.label.max

Length of picklistLabel must be less than or equal to 255.

# validation.picklist.fullname.length

picklistFullNames cannot exceed 1000 items

# validation.picklist.label.length

picklistLabels cannot exceed 1000 items

# validation.formula.treatblanksas.options

formulaTreatBlanks must be one of the following:

# validation.referenceto.format

referenceTo can only contain alphanumeric characters, must begin with a letter, cannot end with an underscore or contain two consecutive underscore characters.

# validation.referenceto.underscore

referenceTo cannot contain two consecutive underscore characters,

# validation.referenceto.blank

referenceTo must not be blank.

# validation.referenceto.length

Length of referenceTo must be less than or equal to 40.

# validation.relationshipname.format

relationshipName can only contain alphanumeric characters, must begin with a letter, cannot end with an underscore or contain two consecutive underscore characters.

# validation.relationshipname.underscore

relationshipName cannot contain two consecutive underscore characters.

# validation.relationshipname.blank

relationshipName must not be blank.

# validation.relationshipname.length

Length of relationshipName must be less than or equal to 40.

# validation.relationshiplabel.length

Length of relationshipLabel must be less than or equal to 80.

# validation.relationshiporder.options

relationshipOrder must be one of the followings:

# validation.deleteconstraint.options

deleteConstraint must be one of the followings:

# validation.reparentablemasterdetail.options

reparentableMasterDetail must be true or false.

# validation.writerequiresmasterread.options

writeRequiresMasterRead must be true or false.

# validation.summaryoperation.options

summaryOperation must be one of the followings:

# validation.description.length

Length of description must be less than or equal to 1000.

# validation.inlinehelptext.length

Length of inlineHelpText must be less than or equal to 510.

# validation.summarizedfield.invalid.reference

summarizedField must be in the form of ObjectFullName.FieldFullName.

# validation.summarizedfield.format

summarizedField can only contain alphanumeric characters, must begin with a letter, cannot end with an underscore or contain two consecutive underscore characters.

# validation.summarizedfield.underscore

summarizedField cannot contain two consecutive underscore characters,

# validation.summarizedfield.blank

summarizedField must not be blank.

# validation.summarizedfield.length

Length of summarizedField must be less than or equal to 40.

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

# failureSave

To update exiting files, Add the flag --updates to this command."

# examples

- Generates metadata from input to a csv file in ouputdir:

  <%= config.bin %> <%= command.id %> --input ./input.csv --outputdir ./outputdir/

# info.field.generate

field generate
