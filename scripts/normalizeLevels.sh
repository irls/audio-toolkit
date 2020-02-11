#!/bin/bash
#

# Normalizes audio levels for a source audio file in the /data folder.
#
# $1 inputFile: The file name of the source audio, with extension.
# $2 options: String with options
# $3 outputFile: The file name of the destination audio, with extension.
#
# TODO: Any additional parameters should be considered as options for the ffmpeg
# normalization routine.

# streaming loudness normalization -- might want to use dual-pass later?
ffmpeg -i "/data/$1" -af loudnorm=$2 "/data/$3"

# mark this task complete
touch "/data/taskcomplete.marker"
