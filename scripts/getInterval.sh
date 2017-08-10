#!/bin/bash
#

# Gets part of the inputFile, starting from start position with duration duration and saves it to the outputFile

# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The filename for the audio result file.
# $3 start: Start position of the part.
# $4 duration: Duration of the part.
# $5 tmpDir: Temporary directory.

# run task
ffmpeg -ss $3 -i $1 -t $4 $2

# mark this task complete
touch "$5taskcomplete.marker"
