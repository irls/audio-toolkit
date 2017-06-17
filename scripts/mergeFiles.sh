#!/bin/bash
#
# Merges all files in the "/data/source/" folder and saves to outputFile
#  converting format if necessary.
# $1 (inputDir): source files
# $2 (outputFile): merged output file

ffmpeg -f concat -safe 0 -i <(for f in /data/$1*.*; do echo "file '$f'"; done) -c copy /data/$2
