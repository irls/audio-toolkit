#!/bin/bash
#

# Gets audio metadata from a source audio file within the /data folder.
#
# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The file name of the source audio, with extension.


# fetch metadata to output file
# ffmpeg -i "/data/$1" -f "/data/$2"

ffmpeg -i "/data/$1" 2>&1 | grep "Duration" > "/data/$2"


# mark this task complete
touch "/data/taskcomplete.marker"
