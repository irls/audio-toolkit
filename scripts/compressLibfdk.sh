#!/bin/bash
#

# Compress a source audio file in the /data folder using libfdk_aac.
#
# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The file name of the destination audio, with extension.
# $3 parameters: optional, additional parameters
#

echo "ffmpeg -hide_banner -i /data/$1 -c:a libfdk_aac $3 /data/$2"
ffmpeg -hide_banner -y -i "/data/$1" -c:a libfdk_aac $3 "/data/$2"
