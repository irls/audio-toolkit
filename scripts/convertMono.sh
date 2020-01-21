#!/bin/bash
#

# Gets audio metadata from a source audio file within the /data folder.
#
# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The file name of the source audio, with extension.
# $3 copyChannel: The stereo channel number to be the one in mono.


#ffmpeg -hide_banner -i "/data/$1" -map_channel 0.$3.0 "/data/$2"
# Copy one channel to another
ffmpeg -hide_banner -i "/data/$1" -map_channel 0.0.$3 -map_channel 0.0.$3 "/data/chanel2-$2"
# Merge to mono
#ffmpeg -hide_banner -i "/data/chanel2-$2" -ac 1 "/data/$2"
ffmpeg -hide_banner -i "/data/chanel2-$2" -af "pan=mono|c0=c0+c1" "/data/$2"


# mark this task complete
touch "/data/taskcomplete.marker"
