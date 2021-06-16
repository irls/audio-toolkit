#!/bin/bash
#

# Convert inputFile into another format with normalization. Use libfdk_aac, 40k 22050hz, normalize (dynamic) to .95 with noise removal

# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The filename for result.
# $3 normalization: String for dynaudnorm parameters.
# $4 ba: Audio bitrate.
# $5 ar: Audio sampling frequency.
# $6 noiseRemoval: Whether to run filter for noise removal.

if [[$6]]
then
ffmpeg -hide_banner -y -i "/data/audio/$1" -map a, -af anlmdn, -af "dynaudnorm=$3" -c:a libfdk_aac -b:a $4 -ar $5 "/data/audio/$2"
else
ffmpeg -hide_banner -y -i "/data/audio/$1" -af "dynaudnorm=$3" -c:a libfdk_aac -b:a $4 -ar $5 "/data/audio/$2"
fi

# mark this task complete
touch "/data/taskcomplete.marker"

