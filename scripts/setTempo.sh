#!/bin/bash
#

# Set audio tempo. from a source audio file within the /data folder.
#
# $1 inputFile: The file name of the source audio, with extension.
# $2 tempo: data for atempo filter.
# $3 outputFile: The file name where response is written.
# $4 customCommand: If need to set tempo less than 0.5 or more than 2.

if [[ $4 ]]
then
ffmpeg -hide_banner -y -i "/data/$1" -filter:a "$4" -vn "/data/$3"
else
ffmpeg -hide_banner -y -i "/data/$1" -filter:a "atempo=$2" -vn "/data/$3"
fi

