#!/bin/bash
#

# Remove noise from a source audio file in the /data folder using anlmdn filter.
#
# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The file name of the destination audio, with extension.
# $3 parameters: anlmdn filter parameters, optional
#
echo "ffmpeg -hide_banner -y -i /data/$1 -map a, -af anlmdn=$3 /data/$2"
if [[ $3 ]]
then
ffmpeg -hide_banner -y -i "/data/$1" -map a, -af "anlmdn=$3" "/data/$2"
else
ffmpeg -hide_banner -y -i "/data/$1" -map a, -af anlmdn "/data/$2"
fi