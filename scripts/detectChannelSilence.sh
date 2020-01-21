#!/bin/bash
#

# Splits inputFile into two files: outputFile1 & outputFile2

# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: File with silence positions.
# $3 noiseLevel: The level of noise to detect, e.g. -20dB.
# $4 length: The silence length in seconds to detect, e.g. 2.
# $5 channelNumber: number of channel to detect, e.g. 0.
# 
ffmpeg -hide_banner -i "/data/$1" -af "pan=1c|c0=c$5,silencedetect=noise=$3:d=$4" -f null - 2> "/data/$2"

# mark this task complete
touch "/data/taskcomplete.marker"
