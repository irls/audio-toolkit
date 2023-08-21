#!/bin/bash
#

# Set audio tempo. from a source audio file within the /data folder.
#
# $1 inputFile: The file name of the source audio, with extension.
# $2 tempo: data for atempo filter.
# $3 outputFile: The file name where response is written.

ffmpeg -hide_banner -i "/data/$1" -filter:a "atempo=$2" -vn "/data/$3"

