#!/bin/bash
#

# Gets audio metadata like genre, artist, etc. from a source audio file within the /data folder.
#
# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The file name where response is written.

ffmpeg -i "/data/$1" -f ffmetadata "/data/$2"