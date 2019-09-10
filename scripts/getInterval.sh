#!/bin/bash
#
# Gets part of the inputFile, starting from start position with duration duration and saves it to the outputFile

# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The filename for the audio result file.
# $3 start: Start position of the part.
# $4 duration: Duration of the part.

# run task
filter='atrim=start='$3
if [[ $4 ]]
then
  filter=$filter':duration='$4
fi
ffmpeg -i "/data/$1" -af $filter /data/$2

# mark this task complete
touch "/data/taskcomplete.marker"
