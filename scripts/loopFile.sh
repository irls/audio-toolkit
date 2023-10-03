#!/bin/bash
#

# Loop file

# $1 inputFile: The file name of the source audio, with extension.
# $2 loop: The loop count
# $3 outputFile: The output filename.

ffmpeg -hide_banner -y -stream_loop $2 -i "$1" -c:a copy "/data/$3"