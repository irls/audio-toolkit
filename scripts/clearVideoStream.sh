#!/bin/bash
#

# Clear video stream from a source audio file within the /data folder.
#
# $1 inputFile: The file name of the source audio, with extension.
# $2 destFile: The file name of the dest audio, with extension.


ffmpeg -hide_banner -i "/data/$1" -map 0 -map -0:v "/data/$2"