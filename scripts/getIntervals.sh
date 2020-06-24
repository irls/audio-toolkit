#!/bin/bash
#
# Gets part of the inputFile, starting from start position with duration duration and saves it to the outputFile

# $1 inputFile: The file name of the source audio, with extension.
# $2 splitPositions: Array of positions for split.
# $3 start: Start position of the part.
# $4 duration: Duration of the part.

# run task
IFS='|'
subDelimeter=,
read -ra points <<< "$2"
arraylength=${#points[@]};

IFS=','
ffmpeg -hide_banner -i "/data/$1" "/data/$1.wav"
for i in "${!points[@]}";
do
  read -ra filePoints <<< "${points[$i]}"


  filter='atrim=start='${filePoints[0]}':duration='${filePoints[1]}
  ffmpeg -hide_banner -i "/data/$1.wav" -af $filter "/data/output/$i.wav"
  ffmpeg -hide_banner -i "/data/output/$i.wav" "/data/output/$i.flac"
  ffmpeg -hide_banner -i "/data/output/$i.flac" "/data/output/$i.m4a"
done;