#!/bin/bash
#

# Normalizes audio levels for a source audio file in the /data folder.
#
# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The file name of the destination audio, with extension.
#
# TODO: Any additional parameters should be considered as options for the ffmpeg
# normalization routine.


# https://stackoverflow.com/questions/25697596/using-ffmpeg-with-silencedetect-to-remove-audio-silence
# https://ffmpeg.org/ffmpeg-filters.html#silenceremove
ffmpeg -i "/data/$1" -af silenceremove=0:0:0:-1:1:-90dB "/data/$2"



# mark this task complete
touch "/data/taskcomplete.marker"
