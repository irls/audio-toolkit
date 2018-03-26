#!/bin/bash
#

# Splits inputFile into two files: outputFile1 & outputFile2

# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: File with silence positions.
# $3 noiseLevel: The level of noise to detect, e.g. -20dB.
# $4 length: The silence length in seconds to detect, e.g. 2.
# 
ffmpeg -i "/data/$1" -af silencedetect=n=$3:d=$4 -f null - 2> "/data/$2"

# mark this task complete
touch "/data/taskcomplete.marker"