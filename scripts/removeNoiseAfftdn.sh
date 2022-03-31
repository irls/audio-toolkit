#!/bin/bash
#

# Remove noise from a source audio file in the /data folder using afftdn filter.
#
# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The file name of the destination audio, with extension.
# $3 noiseStart: start position of noise for asendcmd, optional
# $4 noiseEnd: end position of noise for asendcmd, optional
# $5 parameters: afftdn filter parameters, optional
#

#ffmpeg -hide_banner -y -i dummy_1612942934502_133_en-bl3w_wo_tmp.wav -af "asendcmd=0 afftdn sn start,asendcmd=0.1 afftdn sn stop,afftdn=tn=1" dummy_1612942934502_133_en-bl3w_wo.wav

parameters="afftdn"

if [[ $5 ]]
then
parameters="afftdn=$5"
fi

if [[ $3 && $4 ]]
then
echo "ffmpeg -hide_banner -y -i /data/$1 -af asendcmd=$3 afftdn sn start,asendcmd=$4 afftdn sn stop, $parameters /data/$2"
ffmpeg -hide_banner -y -i "/data/$1" -af "asendcmd=$3 afftdn sn start,asendcmd=$4 afftdn sn stop, $parameters" "/data/$2"
else
echo "ffmpeg -hide_banner -y -i /data/$1 -af $parameters /data/$2"
ffmpeg -hide_banner -y -i "/data/$1" -af "$parameters" "/data/$2"
fi
