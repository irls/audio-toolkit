#!/bin/bash
#

# Make an ffmpeg call with specified params.
#
# $1 inputFile: source file path.
# $2 inputParams: string with command details.
# $3 outputFile: output file path.

if [[ $3 ]]
then
ffmpeg -hide_banner -i "$1" $2 "$3"
elif [[ $2 ]]
then
ffmpeg -hide_banner -i "$1" $2
else
ffmpeg $1
fi


# mark this task complete
#touch "/data/taskcomplete.marker"

