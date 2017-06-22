#!/bin/bash
#

# Splits inputFile into two files: outputFile1 & outputFile2

# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile1: The filename for the audio before the split position.
# $3 outputFile2: The filename for the audio after the split position.
# $4 position: The position at which the source file should be split.

# copy the first part to outputFile1 ($2)
ffmpeg -i "/data/$1" -acodec copy -t $4 -ss 00:00:00 "/data/$2"

# copy the rest to outputFile2 ($3)
ffmpeg -i "/data/$1" -acodec copy -ss $4 "/data/$3"

# mark this task complete
touch "/data/taskcomplete.marker"
