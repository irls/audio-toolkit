#!/bin/bash
#

# Delete section. Split, split then merge

# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The filename for the audio before the split position.
# $3 fromPos: The position at which the source file should be split.
# $4 toPos: The position at which the source file should be split.

# ext="${1##*.}"

# extract the selection to outputFile
## TODO: check that the syntax is correct
ffmpeg -i "/data/$1" -acodec copy -t $3 -ss $4 "/data/$2"



# mark this task complete
touch "/data/taskcomplete.marker"
