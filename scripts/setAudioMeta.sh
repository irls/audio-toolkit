#!/bin/bash
#

# Set audio metadata like genre, artist, etc. from a source audio file within the /data folder.
#
# $1 inputFile: The file name of the source audio, with extension.
# $2 metaFile: The file name where metadata is written.
# $3 outputFile: The file name where response is written.

ffmpeg -i "/data/$1" -i "/data/$2" -map_metadata 1 -codec copy "/data/$3"
