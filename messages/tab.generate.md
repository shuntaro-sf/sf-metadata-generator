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

# validation.label.blank

label: Label Name must not be blank.

# validation.label.length

Length of label must be less than or equal to 40.

# validation.no.type

Column of type can not be found.

# validation.type.options

type must be one of the followings:

# validation.url.format

url must start with 'https://'.

# validation.motif.format

motif must be the form of 'motif index: motif name'

# validation.lwccomponent.format

lwcComponent can only contain alphanumeric characters, must begin with a letter, cannot end with an underscore or contain two consecutive underscore characters.

# validation.page.format

page can only contain alphanumeric characters, must begin with a letter, cannot end with an underscore or contain two consecutive underscore characters.

# validation.flexipage.format

flexiPage can only contain alphanumeric characters, must begin with a letter, cannot end with an underscore or contain two consecutive underscore characters.

# validation.splashpagelink.options

splashPageLink can only contain alphanumeric characters, must begin with a letter, cannot end with an underscore or contain two consecutive underscore characters.

# validation.hassidebar.options

hasSidebar must be true or false.

# validation.customobject.options

customObject must be true or false.

# validation.description.length

Length of description must be less than or equal to 1000.

# validation.inlinehelptext.length

Length of inlineHelpText must be less than or equal to 510.

# validation.frameheight.type

frameHeight must be an integer.

# validation.frameheight.min

frameHeight must be a positive integer.

# validation.frameheight.max

frameHeight must be less than or equal to 9,999.

# failureSave

To update exiting files, Add the flag --updates to this command."

# examples

- Converts metadata in sourcedir to a csv file in ouputdir:

  <%= config.bin %> <%= command.id %> --input ./input.csv --outputdir ./outputdir/

# info.field.generate

tab generate
