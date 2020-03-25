#!/bin/bash
#

# Detect audio levels for a source audio file in the /data folder.
#
# $1 inputFile: The file name of the source audio, with extension.
# $2 optionsString: String with options.
#
# streaming loudness normalization -- might want to use dual-pass later?
ffmpeg -hide_banner -i "/data/$1" -af loudnorm=$2:print_format=json -f null - 2> "/data/levels"

# mark this task complete
touch "/data/taskcomplete.marker"

