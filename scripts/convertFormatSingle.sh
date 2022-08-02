#!/bin/bash
#
# // Converts specified file to a specified format.
# // $1 file: file name.
# // $2 fileDest: The destination file name.

ffmpeg -hide_banner -y -i "/data/$1" -ar 44100 "/data/$2"