#!/bin/bash
#
# Replaces a selection of audio within the source file with the audio in a 
# fragment file. Both source and fragment audio must be in the /data folder.
# Parameters:
# $1 (sourceFileName) = The file name of the source audio, with extension.
# $2 (fragmentFile) = The file name of the fragment audio, with extension.
# $3 (fromPos) = The position at which to begin deletion.
# $4 (toPos) = The position at which to stop deletion.
# $5 (destFileName) = The output file name.
