#!/bin/bash
#
# Deletes a selection of audio from a source audio file in the /data folder.
# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The output file name.
# $3 fromPos: The position at which to begin deletion.
# $4 toPos: The position at which to stop deletion.

# split inputFile in three parts
# merge the first and last part into outputFile
