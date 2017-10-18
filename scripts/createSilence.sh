#!/bin/bash
#
# Generates silence file in "/data/" folder
# $1 (length): the length of necessary silence
# $2 (destFile): the silence file name

ffmpeg -f lavfi -i aevalsrc=0:0::duration=$1 -ab 320k /data/$2


# mark this task complete
touch "/data/taskcomplete.marker"

