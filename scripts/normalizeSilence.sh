#!/bin/bash
#

# Normalizes audio levels for a source audio file in the /data folder.
#
# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The file name of the destination audio, with extension.
#
# TODO: Any additional parameters should be considered as options for the ffmpeg
# normalization routine.


# stub
cp "/data/$1" "/data/$2"


# mark this task complete
touch "/data/taskcomplete.marker"
