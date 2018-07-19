#!/bin/bash
#
# Merges all files in the "/data/source/" folder and saves to outputFile
#  converting format if necessary.
# $1 (inputDir): source files
# $2 (outputFile): merged output file
filelist=''
filter=''
i=0
for f in /data/$1/*.*; do 
  filelist=$filelist" -i $f"
  filter=$filter"[$i:0]"
  i=$((i+1))
done
filter=$filter"concat=n=$i:v=0:a=1[out]"
echo $filelist
echo $filter
ffmpeg  $filelist -filter_complex $filter -map '[out]' /data/$2


# mark this task complete
touch "taskcomplete.marker"
#ffmpeg -i input1.wav -i input2.wav -i input3.wav -i input4.wav -filter_complex '[0:0][1:0][2:0][3:0]concat=n=4:v=0:a=1[out]' -map '[out]' output.wav