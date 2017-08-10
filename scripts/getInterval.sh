#!/bin/bash
#

# Splits inputFile into two files: outputFile1 & outputFile2

# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The filename for the audio result file.
# $3 start: Start position of the part.
# $4 end: End position of the part.
# $5 tmpDir: Temporary directory.

# run task
ffmpeg -ss $3 -i $1 -t $4 $2

# mark this task complete
touch "$5taskcomplete.marker"
