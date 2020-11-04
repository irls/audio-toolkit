#!/bin/bash
#

# Get audio levels for a source audio file in the /data folder.
#
# $1 inputFile: The file name of the source audio, with extension.
#
# TODO: Any additional parameters should be considered as options for the ffmpeg
# normalization routine.

ffmpeg -hide_banner -i "/data/audio/$1" -filter:a volumedetect  -f null /dev/null > /data/output 2>&1

# mark this task complete
touch "/data/taskcomplete.marker"

