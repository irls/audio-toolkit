#!/bin/bash
#

# Detect audio levels for a source audio file in the /data folder.
#
# $1 inputFile: The file name of the source audio, with extension.
# $3 points: points list.
# $3 gain: gain.
# $4 outputFile: The file name of output file.
#

ffmpeg -hide_banner -i "/data/$1" -filter_complex "compand=attacks=0:decays=0.3:points=$2:gain=$3" "/data/$4"

# mark this task complete
touch "/data/taskcomplete.marker"


