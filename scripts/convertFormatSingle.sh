#!/bin/bash
#
# // Converts specified file to a specified format.
# // $1 file: file name.
# // $2 fileDest: The destination file name.
# // $3 command: additional params, e.g. bitrate, encoder etc.

ffmpeg -hide_banner -y -i "/data/$1" $3 "/data/$2"