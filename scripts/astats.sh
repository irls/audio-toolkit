#!/bin/bash
#

# Run astats filter for input audiofile

# $1 inputFile: The file name of the source audio, with extension.
# $2 statistic: Statistic name to get
# $3 outputFile: File where statistic should be saved.
# 
ffmpeg -hide_banner -i "/data/$1" -af astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.$2:file="/data/$3" -f null -