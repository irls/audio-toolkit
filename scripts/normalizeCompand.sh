#!/bin/bash
#

# Detect audio levels for a source audio file in the /data folder.
#
# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The file name of output file.
#

ffmpeg -hide_banner -i "/data/$1" -filter_complex "compand=attacks=0:points=-60/-900|-30/-20|-20/-9|0/-7|20/-3" "/data/$2"

# mark this task complete
touch "/data/taskcomplete.marker"


